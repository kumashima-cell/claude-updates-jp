import { createHash } from "crypto";
import type { SourceItem, SourceType } from "@/types";

export interface FetcherResult {
  items: Omit<SourceItem, "id">[];
  errors: string[];
}

function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

// ===== GitHub API Fetcher =====

async function fetchGitHubReleases(): Promise<FetcherResult> {
  const items: Omit<SourceItem, "id">[] = [];
  const errors: string[] = [];

  try {
    const res = await fetch(
      "https://api.github.com/repos/anthropics/claude-code/releases?per_page=10",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

    const releases = await res.json();
    for (const release of releases) {
      const raw = `${release.name}\n\n${release.body ?? ""}`;
      items.push({
        source_type: "claude_code_releases",
        title: release.name || release.tag_name,
        url: release.html_url,
        raw_content: raw,
        published_at: release.published_at,
        fetched_at: new Date().toISOString(),
        content_hash: contentHash(raw),
      });
    }
  } catch (e) {
    errors.push(`claude_code_releases: ${(e as Error).message}`);
  }

  return { items, errors };
}

async function fetchGitHubChangelog(): Promise<FetcherResult> {
  const items: Omit<SourceItem, "id">[] = [];
  const errors: string[] = [];

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md",
      { headers: { Accept: "text/plain" } }
    );
    if (!res.ok) throw new Error(`GitHub raw error: ${res.status}`);

    const content = await res.text();
    // CHANGELOG全体を1アイテムとして保存（差分はcontent_hashで検出）
    items.push({
      source_type: "claude_code_changelog",
      title: "Claude Code CHANGELOG",
      url: "https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md",
      raw_content: content,
      published_at: null,
      fetched_at: new Date().toISOString(),
      content_hash: contentHash(content),
    });
  } catch (e) {
    errors.push(`claude_code_changelog: ${(e as Error).message}`);
  }

  return { items, errors };
}

// ===== RSS Fetcher =====

async function fetchEngineeringBlogRSS(): Promise<FetcherResult> {
  const items: Omit<SourceItem, "id">[] = [];
  const errors: string[] = [];

  try {
    // Community-maintained RSS feed for Anthropic engineering blog
    const res = await fetch(
      "https://raw.githubusercontent.com/conoro/anthropic-engineering-rss-feed/main/feed.xml"
    );
    if (!res.ok) throw new Error(`RSS fetch error: ${res.status}`);

    const xml = await res.text();
    // Simple XML parsing for RSS items
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    for (const itemXml of itemMatches.slice(0, 10)) {
      const title =
        itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
        itemXml.match(/<title>(.*?)<\/title>/)?.[1] ??
        "Untitled";
      const link =
        itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
      const description =
        itemXml.match(
          /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/
        )?.[1] ??
        itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] ??
        "";
      const pubDate =
        itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? null;

      const raw = `${title}\n\n${description}`;
      items.push({
        source_type: "engineering_blog",
        title,
        url: link,
        raw_content: raw,
        published_at: pubDate ? new Date(pubDate).toISOString() : null,
        fetched_at: new Date().toISOString(),
        content_hash: contentHash(raw),
      });
    }
  } catch (e) {
    errors.push(`engineering_blog: ${(e as Error).message}`);
  }

  return { items, errors };
}

// ===== Playwright Scraper =====
// Anthropic公式サイトはSPA。PlaywrightでJSレンダリング後に取得

async function fetchWithPlaywright(
  sourceType: SourceType,
  url: string,
  extractFn: (page: import("playwright").Page) => Promise<Omit<SourceItem, "id">[]>
): Promise<FetcherResult> {
  const items: Omit<SourceItem, "id">[] = [];
  const errors: string[] = [];

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const extracted = await extractFn(page);
    items.push(...extracted);

    await browser.close();
  } catch (e) {
    errors.push(`${sourceType}: ${(e as Error).message}`);
  }

  return { items, errors };
}

async function fetchAnthropicNews(): Promise<FetcherResult> {
  return fetchWithPlaywright(
    "anthropic_news",
    "https://www.anthropic.com/news",
    async (page) => {
      const articles = await page.$$eval("article, [data-testid='news-card'], a[href*='/news/']", (els) =>
        els.slice(0, 10).map((el) => {
          const title = el.querySelector("h2, h3")?.textContent?.trim() ?? "";
          const href = el.getAttribute("href") ?? el.querySelector("a")?.getAttribute("href") ?? "";
          const desc = el.querySelector("p")?.textContent?.trim() ?? "";
          return { title, href, desc };
        })
      );

      return articles
        .filter((a) => a.title && a.href)
        .map((a) => {
          const fullUrl = a.href.startsWith("http")
            ? a.href
            : `https://www.anthropic.com${a.href}`;
          const raw = `${a.title}\n\n${a.desc}`;
          return {
            source_type: "anthropic_news" as SourceType,
            title: a.title,
            url: fullUrl,
            raw_content: raw,
            published_at: null,
            fetched_at: new Date().toISOString(),
            content_hash: contentHash(raw),
          };
        });
    }
  );
}

async function fetchAPIReleaseNotes(): Promise<FetcherResult> {
  return fetchWithPlaywright(
    "api_release_notes",
    "https://docs.anthropic.com/en/docs/about-claude/models",
    async (page) => {
      const text = await page.textContent("main") ?? "";
      const raw = text.slice(0, 10000); // 長すぎるコンテンツはトリミング
      return [
        {
          source_type: "api_release_notes" as SourceType,
          title: "Claude API Models Documentation",
          url: "https://docs.anthropic.com/en/docs/about-claude/models",
          raw_content: raw,
          published_at: null,
          fetched_at: new Date().toISOString(),
          content_hash: contentHash(raw),
        },
      ];
    }
  );
}

async function fetchAnthropicResearch(): Promise<FetcherResult> {
  return fetchWithPlaywright(
    "anthropic_research",
    "https://www.anthropic.com/research",
    async (page) => {
      const articles = await page.$$eval("article, a[href*='/research/']", (els) =>
        els.slice(0, 10).map((el) => {
          const title = el.querySelector("h2, h3")?.textContent?.trim() ?? el.textContent?.trim() ?? "";
          const href = el.getAttribute("href") ?? el.querySelector("a")?.getAttribute("href") ?? "";
          const desc = el.querySelector("p")?.textContent?.trim() ?? "";
          return { title, href, desc };
        })
      );

      return articles
        .filter((a) => a.title && a.href)
        .map((a) => {
          const fullUrl = a.href.startsWith("http")
            ? a.href
            : `https://www.anthropic.com${a.href}`;
          const raw = `${a.title}\n\n${a.desc}`;
          return {
            source_type: "anthropic_research" as SourceType,
            title: a.title,
            url: fullUrl,
            raw_content: raw,
            published_at: null,
            fetched_at: new Date().toISOString(),
            content_hash: contentHash(raw),
          };
        });
    }
  );
}

// ===== Main Fetcher =====

export type FetcherName = SourceType;

const FETCHERS: Record<FetcherName, () => Promise<FetcherResult>> = {
  claude_code_releases: fetchGitHubReleases,
  claude_code_changelog: fetchGitHubChangelog,
  engineering_blog: fetchEngineeringBlogRSS,
  anthropic_news: fetchAnthropicNews,
  api_release_notes: fetchAPIReleaseNotes,
  anthropic_research: fetchAnthropicResearch,
};

export async function fetchAllSources(): Promise<FetcherResult> {
  const allItems: Omit<SourceItem, "id">[] = [];
  const allErrors: string[] = [];

  const results = await Promise.allSettled(
    Object.values(FETCHERS).map((fn) => fn())
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value.items);
      allErrors.push(...result.value.errors);
    } else {
      allErrors.push(`Fetcher failed: ${result.reason}`);
    }
  }

  return { items: allItems, errors: allErrors };
}

export async function fetchSource(name: FetcherName): Promise<FetcherResult> {
  const fetcher = FETCHERS[name];
  if (!fetcher) throw new Error(`Unknown source: ${name}`);
  return fetcher();
}
