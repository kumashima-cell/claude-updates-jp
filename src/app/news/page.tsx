import { getPublishedArticles } from "@/lib/db/queries";
import { ArticleCard } from "@/components/ArticleCard";

export const revalidate = 1800;

export const metadata = {
  title: "News",
  description: "Anthropic/Claude の最新ニュース一覧",
};

export default async function NewsPage() {
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];

  try {
    articles = await getPublishedArticles(50);
  } catch {
    // DB未接続時のフォールバック
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">News</h1>

      {articles.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500">
          <p>まだ記事がありません</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
