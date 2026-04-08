-- ===== Source Items =====
-- ソース原文を永続保存。記事から原文への完全トレーサビリティ
create table if not exists source_items (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in (
    'anthropic_news', 'api_release_notes', 'claude_code_releases',
    'claude_code_changelog', 'engineering_blog', 'anthropic_research'
  )),
  title text not null,
  url text not null,
  raw_content text not null,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  content_hash text not null,
  created_at timestamptz not null default now()
);

-- URL重複防止
create unique index if not exists idx_source_items_content_hash
  on source_items (content_hash);

-- ===== Extracted Facts =====
-- Stage 2で抽出された事実。記事の各主張をソースまで追跡可能
create table if not exists extracted_facts (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null references source_items(id) on delete cascade,
  claim text not null,
  source_quote text not null,
  source_url text not null,
  confidence text not null check (confidence in ('confirmed', 'uncertain')),
  created_at timestamptz not null default now()
);

create index if not exists idx_extracted_facts_source
  on extracted_facts (source_item_id);

-- ===== Articles =====
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  content text not null,
  category text not null check (category in (
    'model_release', 'api_update', 'claude_code_update',
    'research', 'engineering', 'pricing', 'other'
  )),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  fact_check_score integer not null default 0,
  fact_check_issues jsonb not null default '[]',
  author_comment text,
  source_item_ids uuid[] not null default '{}',
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_articles_status on articles (status);
create index if not exists idx_articles_category on articles (category);
create index if not exists idx_articles_published_at on articles (published_at desc);

-- ===== Pipeline Logs =====
-- パイプライン実行ログ
create table if not exists pipeline_logs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source_items_fetched integer not null default 0,
  articles_generated integer not null default 0,
  articles_auto_published integer not null default 0,
  articles_sent_to_review integer not null default 0,
  articles_rejected integer not null default 0,
  errors text[] not null default '{}'
);
