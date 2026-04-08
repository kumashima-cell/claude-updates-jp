import type { ArticleCategory } from "@/types";

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  model_release: "Model",
  api_update: "API",
  claude_code_update: "Claude Code",
  research: "Research",
  engineering: "Engineering",
  pricing: "Pricing",
  other: "Other",
};

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  model_release: "bg-purple-100 text-purple-700",
  api_update: "bg-blue-100 text-blue-700",
  claude_code_update: "bg-green-100 text-green-700",
  research: "bg-orange-100 text-orange-700",
  engineering: "bg-teal-100 text-teal-700",
  pricing: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export function CategoryBadge({ category }: { category: ArticleCategory }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded ${CATEGORY_COLORS[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export function FactCheckBadge({ score }: { score: number }) {
  if (score >= 85) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
        検証済み
      </span>
    );
  }
  if (score >= 60) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
        一部未確認あり
      </span>
    );
  }
  return null;
}

export function UnofficialBadge() {
  return (
    <span className="text-xs font-medium px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
      公式未確認
    </span>
  );
}
