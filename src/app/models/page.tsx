export const metadata = {
  title: "Models",
  description: "Claude モデル一覧・比較",
};

// TODO: Supabaseからモデルデータを動的に取得する（Phase 7）
const MODELS = [
  {
    name: "Claude Opus 4.6",
    id: "claude-opus-4-6",
    context: "200K",
    maxOutput: "32K",
    pricing: { input: "$15", output: "$75" },
    features: ["Extended Thinking", "Tool Use", "Vision"],
  },
  {
    name: "Claude Sonnet 4.6",
    id: "claude-sonnet-4-6-20250514",
    context: "200K",
    maxOutput: "16K",
    pricing: { input: "$3", output: "$15" },
    features: ["Extended Thinking", "Tool Use", "Vision"],
  },
  {
    name: "Claude Haiku 4.5",
    id: "claude-haiku-4-5-20251001",
    context: "200K",
    maxOutput: "8K",
    pricing: { input: "$0.80", output: "$4" },
    features: ["Tool Use", "Vision"],
  },
];

export default function ModelsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Claude Models
      </h1>
      <p className="text-gray-600 mb-6">
        現在利用可能なClaudeモデルの一覧と比較。パイプラインが更新情報を検知すると自動更新されます。
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Model
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Model ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Context
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Max Output
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Input / 1M tokens
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Output / 1M tokens
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Features
              </th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((model) => (
              <tr
                key={model.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {model.name}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                    {model.id}
                  </code>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {model.context}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {model.maxOutput}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {model.pricing.input}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {model.pricing.output}
                </td>
                <td className="py-3 px-4 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {model.features.map((f) => (
                      <span
                        key={f}
                        className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        ※ 価格・スペックは記事執筆時点のものです。最新情報は公式ドキュメントをご確認ください。
      </p>
    </div>
  );
}
