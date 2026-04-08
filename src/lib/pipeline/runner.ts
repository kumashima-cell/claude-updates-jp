import { fetchAllSources } from "@/lib/sources/fetcher";
import { sourceItemExists, insertSourceItem } from "@/lib/db/queries";
import { insertPipelineLog } from "@/lib/db/queries";
import { processSourceItem } from "./article-generator";
import { notifySlack } from "@/lib/notify";
import type { SourceItem, PipelineResult } from "@/types";

export async function runPipeline(): Promise<PipelineResult> {
  const result: PipelineResult = {
    source_items_fetched: 0,
    articles_generated: 0,
    articles_auto_published: 0,
    articles_sent_to_review: 0,
    articles_rejected: 0,
    errors: [],
  };

  // Stage 1: 全ソース巡回
  const { items, errors: fetchErrors } = await fetchAllSources();
  result.errors.push(...fetchErrors);

  // 新規アイテムのみフィルタ
  const newItems: SourceItem[] = [];
  for (const item of items) {
    const exists = await sourceItemExists(item.content_hash);
    if (!exists) {
      const id = await insertSourceItem(item as SourceItem);
      newItems.push({ ...item, id } as SourceItem);
    }
  }
  result.source_items_fetched = newItems.length;

  if (newItems.length === 0) {
    await insertPipelineLog(result);
    return result;
  }

  // 1日最大3記事制限（importance: high を優先）
  const MAX_ARTICLES_PER_RUN = 3;
  const itemsToProcess = newItems.slice(0, MAX_ARTICLES_PER_RUN);

  // Stage 2-5: 各アイテムをパイプライン処理
  for (const item of itemsToProcess) {
    try {
      const decision = await processSourceItem(item);
      result.articles_generated++;

      switch (decision.action) {
        case "auto_publish":
          result.articles_auto_published++;
          await notifySlack(
            `[自動公開] ${decision.article.title}\nスコア: ${decision.article.fact_check_score}/100`
          );
          break;
        case "send_to_review":
          result.articles_sent_to_review++;
          await notifySlack(
            `[要レビュー] ${decision.article.title}\nスコア: ${decision.article.fact_check_score}/100\n問題: ${decision.article.fact_check_issues.map((i) => i.description).join(", ")}`
          );
          break;
        case "reject":
          result.articles_rejected++;
          await notifySlack(
            `[生成失敗] ${decision.article.title}\nスコア: ${decision.article.fact_check_score}/100`
          );
          break;
      }
    } catch (e) {
      const errorMsg = `Pipeline error for "${item.title}": ${(e as Error).message}`;
      result.errors.push(errorMsg);
      await notifySlack(`[エラー] ${errorMsg}`);
    }
  }

  await insertPipelineLog(result);
  return result;
}
