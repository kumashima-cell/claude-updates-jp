import { getSupabase } from "./supabase";
import type {
  SourceItem,
  ExtractedFact,
  Article,
  ArticleStatus,
} from "@/types";

// ===== Source Items =====

export async function sourceItemExists(contentHash: string): Promise<boolean> {
  const { count } = await getSupabase()
    .from("source_items")
    .select("id", { count: "exact", head: true })
    .eq("content_hash", contentHash);
  return (count ?? 0) > 0;
}

export async function insertSourceItem(item: SourceItem): Promise<string> {
  const { data, error } = await getSupabase()
    .from("source_items")
    .insert(item)
    .select("id")
    .single();
  if (error) throw new Error(`Failed to insert source item: ${error.message}`);
  return data.id;
}

export async function getSourceItem(id: string): Promise<SourceItem | null> {
  const { data } = await getSupabase()
    .from("source_items")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

// ===== Extracted Facts =====

export async function insertFacts(facts: ExtractedFact[]): Promise<void> {
  if (facts.length === 0) return;
  const { error } = await getSupabase().from("extracted_facts").insert(facts);
  if (error) throw new Error(`Failed to insert facts: ${error.message}`);
}

export async function getFactsBySourceItemId(
  sourceItemId: string
): Promise<ExtractedFact[]> {
  const { data, error } = await getSupabase()
    .from("extracted_facts")
    .select("*")
    .eq("source_item_id", sourceItemId);
  if (error) throw new Error(`Failed to get facts: ${error.message}`);
  return data ?? [];
}

// ===== Articles =====

export async function insertArticle(article: Article): Promise<string> {
  const { data, error } = await getSupabase()
    .from("articles")
    .insert(article)
    .select("id")
    .single();
  if (error) throw new Error(`Failed to insert article: ${error.message}`);
  return data.id;
}

export async function updateArticleStatus(
  id: string,
  status: ArticleStatus,
  publishedAt?: string
): Promise<void> {
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (publishedAt) update.published_at = publishedAt;

  const { error } = await getSupabase()
    .from("articles")
    .update(update)
    .eq("id", id);
  if (error)
    throw new Error(`Failed to update article status: ${error.message}`);
}

export async function updateArticleAuthorComment(
  id: string,
  comment: string
): Promise<void> {
  const { error } = await getSupabase()
    .from("articles")
    .update({
      author_comment: comment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error)
    throw new Error(`Failed to update author comment: ${error.message}`);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data } = await getSupabase()
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getPublishedArticles(
  limit = 20,
  offset = 0,
  category?: string
): Promise<Article[]> {
  let query = getSupabase()
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get articles: ${error.message}`);
  return data ?? [];
}

export async function getDraftArticles(): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("*")
    .eq("status", "draft")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to get drafts: ${error.message}`);
  return data ?? [];
}

export async function getArticleCount(): Promise<number> {
  const { count } = await getSupabase()
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  return count ?? 0;
}

// ===== Pipeline Logs =====

export async function insertPipelineLog(log: {
  source_items_fetched: number;
  articles_generated: number;
  articles_auto_published: number;
  articles_sent_to_review: number;
  articles_rejected: number;
  errors: string[];
}): Promise<void> {
  const { error } = await getSupabase().from("pipeline_logs").insert({
    ...log,
    finished_at: new Date().toISOString(),
  });
  if (error)
    throw new Error(`Failed to insert pipeline log: ${error.message}`);
}
