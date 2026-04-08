// ===== Source Types =====

export type SourceType =
  | "anthropic_news"
  | "api_release_notes"
  | "claude_code_releases"
  | "claude_code_changelog"
  | "engineering_blog"
  | "anthropic_research";

export interface SourceItem {
  id?: string;
  source_type: SourceType;
  title: string;
  url: string;
  raw_content: string;
  published_at: string | null;
  fetched_at: string;
  content_hash: string;
}

// ===== Fact Types =====

export type FactConfidence = "confirmed" | "uncertain";

export interface ExtractedFact {
  id?: string;
  source_item_id: string;
  claim: string;
  source_quote: string;
  source_url: string;
  confidence: FactConfidence;
}

export interface FactExtractionResult {
  facts: ExtractedFact[];
  category: ArticleCategory;
  importance: "high" | "medium" | "low";
}

// ===== Article Types =====

export type ArticleCategory =
  | "model_release"
  | "api_update"
  | "claude_code_update"
  | "research"
  | "engineering"
  | "pricing"
  | "other";

export type ArticleStatus = "draft" | "published" | "rejected";

export interface Article {
  id?: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  status: ArticleStatus;
  fact_check_score: number;
  fact_check_issues: FactCheckIssue[];
  author_comment: string | null;
  source_item_ids: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  noindex: boolean;
}

// ===== Fact Check Types =====

export interface FactCheckIssue {
  type: "missing_source" | "number_mismatch" | "unsupported_claim" | "missing_citation";
  description: string;
  severity: "high" | "medium" | "low";
}

export interface FactCheckResult {
  passed: boolean;
  issues: FactCheckIssue[];
  confidence_score: number;
}

// ===== Pipeline Types =====

export interface PipelineResult {
  source_items_fetched: number;
  articles_generated: number;
  articles_auto_published: number;
  articles_sent_to_review: number;
  articles_rejected: number;
  errors: string[];
}
