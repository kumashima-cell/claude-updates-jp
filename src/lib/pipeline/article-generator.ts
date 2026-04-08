import Anthropic from "@anthropic-ai/sdk";
import type {
  SourceItem,
  ExtractedFact,
  FactExtractionResult,
  FactCheckResult,
  Article,
} from "@/types";
import {
  FACT_EXTRACTION_SYSTEM,
  factExtractionUser,
  ARTICLE_GENERATION_SYSTEM,
  articleGenerationUser,
  FACT_CHECK_SYSTEM,
  factCheckUser,
} from "./prompts";
import {
  insertFacts,
  insertArticle,
  updateArticleStatus,
} from "@/lib/db/queries";

const anthropic = new Anthropic();

function parseJSON<T>(text: string): T {
  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

// ===== Stage 2: 事実抽出 =====

export async function extractFacts(
  sourceItem: SourceItem
): Promise<FactExtractionResult> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: FACT_EXTRACTION_SYSTEM,
    messages: [
      {
        role: "user",
        content: factExtractionUser(
          sourceItem.raw_content,
          sourceItem.url,
          sourceItem.fetched_at
        ),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const result = parseJSON<FactExtractionResult>(text);

  // DB保存
  const factsWithSource: ExtractedFact[] = result.facts.map((f) => ({
    source_item_id: sourceItem.id!,
    claim: f.claim,
    source_quote: f.source_quote,
    source_url: sourceItem.url,
    confidence: f.confidence,
  }));
  await insertFacts(factsWithSource);

  return result;
}

// ===== Stage 3: 記事生成 =====

interface GeneratedArticle {
  content: string;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    slug: string;
  };
}

export async function generateArticle(
  facts: FactExtractionResult,
  sourceUrl: string
): Promise<GeneratedArticle> {
  const factsJson = JSON.stringify(
    {
      ...facts,
      source_url: sourceUrl,
    },
    null,
    2
  );

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 8192,
    system: ARTICLE_GENERATION_SYSTEM,
    messages: [
      {
        role: "user",
        content: articleGenerationUser(factsJson),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // メタデータJSONを本文末尾から抽出
  const metadataMatch = text.match(
    /\{[\s\S]*"title"[\s\S]*"description"[\s\S]*"tags"[\s\S]*"slug"[\s\S]*\}/
  );
  let metadata = {
    title: "Untitled",
    description: "",
    tags: [] as string[],
    slug: `article-${Date.now()}`,
  };
  if (metadataMatch) {
    try {
      metadata = JSON.parse(metadataMatch[0]);
    } catch {
      // fallback to default
    }
  }

  // メタデータ部分を本文から除去
  const content = metadataMatch
    ? text.replace(metadataMatch[0], "").trim()
    : text.trim();

  return { content, metadata };
}

// ===== Stage 4: ファクトチェック =====

export async function factCheck(
  facts: FactExtractionResult,
  articleContent: string,
  sourceUrl: string
): Promise<FactCheckResult> {
  const factsJson = JSON.stringify(
    { ...facts, source_url: sourceUrl },
    null,
    2
  );

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: FACT_CHECK_SYSTEM,
    messages: [
      {
        role: "user",
        content: factCheckUser(factsJson, articleContent),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return parseJSON<FactCheckResult>(text);
}

// ===== Stage 5: 公開判定 =====

export interface PublishDecision {
  action: "auto_publish" | "send_to_review" | "reject";
  article: Article;
}

export async function processSourceItem(
  sourceItem: SourceItem
): Promise<PublishDecision> {
  // Stage 2: 事実抽出
  const facts = await extractFacts(sourceItem);

  // importance: low はnoindex対象
  const isMinorUpdate = facts.importance === "low";

  // Stage 3: 記事生成
  const generated = await generateArticle(facts, sourceItem.url);

  // Stage 4: ファクトチェック
  const checkResult = await factCheck(facts, generated.content, sourceItem.url);

  // 記事オブジェクト構築
  const article: Article = {
    slug: generated.metadata.slug,
    title: generated.metadata.title,
    description: generated.metadata.description,
    content: generated.content,
    category: facts.category,
    tags: generated.metadata.tags,
    status: "draft",
    fact_check_score: checkResult.confidence_score,
    fact_check_issues: checkResult.issues,
    author_comment: null,
    source_item_ids: [sourceItem.id!],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: null,
    noindex: isMinorUpdate,
  };

  // DB保存
  const articleId = await insertArticle(article);
  article.id = articleId;

  // Stage 5: 公開判定
  if (checkResult.confidence_score >= 85 && checkResult.issues.length === 0) {
    await updateArticleStatus(
      articleId,
      "published",
      new Date().toISOString()
    );
    article.status = "published";
    article.published_at = new Date().toISOString();
    return { action: "auto_publish", article };
  }

  if (checkResult.confidence_score < 60) {
    await updateArticleStatus(articleId, "rejected");
    article.status = "rejected";
    return { action: "reject", article };
  }

  // 60-84: 人間レビュー
  return { action: "send_to_review", article };
}
