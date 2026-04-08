import Link from "next/link";
import type { Article } from "@/types";
import { formatDate } from "@/lib/utils";
import { CategoryBadge, FactCheckBadge } from "./Badges";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <CategoryBadge category={article.category} />
        <FactCheckBadge score={article.fact_check_score} />
        {article.published_at && (
          <time
            dateTime={article.published_at}
            className="text-xs text-gray-500 ml-auto"
          >
            {formatDate(article.published_at)}
          </time>
        )}
      </div>
      <Link href={`/news/${article.slug}`}>
        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-1">
          {article.title}
        </h3>
      </Link>
      <p className="text-sm text-gray-600 line-clamp-2">
        {article.description}
      </p>
      {article.tags.length > 0 && (
        <div className="flex gap-1 mt-3">
          {article.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
