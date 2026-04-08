import Link from "next/link";
import { getPublishedArticles, getArticleCount } from "@/lib/db/queries";
import { ArticleCard } from "@/components/ArticleCard";

export const revalidate = 1800; // 30分

export default async function HomePage() {
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let totalCount = 0;

  try {
    articles = await getPublishedArticles(10);
    totalCount = await getArticleCount();
  } catch {
    // DB未接続時のフォールバック
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Dashboard Header */}
      <section className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Claude Updates JP
        </h1>
        <p className="text-gray-600">
          Anthropic/Claude の最新リリース情報を自動収集し、ファクトチェック済みの日本語解説を提供します
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-gray-500">公開記事数</p>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-gray-500">ソース</p>
            <p className="text-2xl font-bold text-gray-900">6</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-gray-500">更新頻度</p>
            <p className="text-2xl font-bold text-gray-900">6h</p>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">最新記事</h2>
          <Link
            href="/news"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            すべて見る →
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500">
            <p className="text-lg mb-2">まだ記事がありません</p>
            <p className="text-sm">
              パイプラインが初回実行されると、ここに記事が表示されます
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
