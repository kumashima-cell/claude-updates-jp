import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/db/queries";
import { CategoryBadge, FactCheckBadge } from "@/components/Badges";
import { formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 3600; // 1時間

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const article = await getArticleBySlug(slug);
    if (!article) return { title: "Not Found" };

    return {
      title: article.title,
      description: article.description,
      openGraph: {
        title: article.title,
        description: article.description,
        type: "article",
        publishedTime: article.published_at ?? undefined,
        modifiedTime: article.updated_at,
      },
      ...(article.noindex ? { robots: { index: false } } : {}),
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let article;
  try {
    article = await getArticleBySlug(slug);
  } catch {
    notFound();
  }

  if (!article || article.status !== "published") {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <CategoryBadge category={article.category} />
          <FactCheckBadge score={article.fact_check_score} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {article.published_at && (
            <time dateTime={article.published_at}>
              公開: {formatDateTime(article.published_at)}
            </time>
          )}
          <time dateTime={article.updated_at}>
            更新: {formatDateTime(article.updated_at)}
          </time>
        </div>
        {article.tags.length > 0 && (
          <div className="flex gap-1 mt-3">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div
        className="article-content"
        dangerouslySetInnerHTML={{
          __html: markdownToHtml(article.content),
        }}
      />

      {/* Author Comment */}
      {article.author_comment && (
        <div className="author-comment">
          <p className="text-sm font-medium text-blue-800 mb-2">
            筆者コメント
          </p>
          <p className="text-sm text-blue-900">{article.author_comment}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-4">
          この記事はAI支援により作成され、編集者が監修しています。
          情報の正確性は公式ソースでご確認ください。
        </p>
        <a
          href="mailto:report@example.com?subject=誤り報告"
          className="text-sm text-red-600 hover:text-red-700"
        >
          この記事の誤りを報告 →
        </a>
      </footer>
    </article>
  );
}

// Simple markdown to HTML converter
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\[出典: (.*?)\]/g, '<a href="$1" target="_blank" rel="noopener">[出典]</a>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^\- (.*$)/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(.+)$/gm, (match) => {
      if (
        match.startsWith("<h") ||
        match.startsWith("<ul") ||
        match.startsWith("<li") ||
        match.startsWith("<p") ||
        match.startsWith("</")
      )
        return match;
      return `<p>${match}</p>`;
    });
}
