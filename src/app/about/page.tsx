export const metadata = {
  title: "About",
  description: "Claude Updates JP について",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">About</h1>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Claude Updates JP とは
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Claude Updates JP は、Anthropic/Claude に関する最新のリリース情報、API更新、
          研究論文などを自動収集し、ファクトチェック済みの日本語解説を提供するメディアです。
        </p>
        <p className="text-gray-700 leading-relaxed">
          6つの公式ソースを6時間ごとに巡回し、新しい情報が見つかると自動で記事を生成します。
          すべての記事は事実抽出 → 記事生成 → ファクトチェックの3段階パイプラインを経ており、
          各事実主張にはソースへのリンクが付与されています。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          情報の正確性について
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          本サイトの記事はAI支援により作成され、編集者が監修しています。
          すべての事実主張は原文ソースとの照合を経ていますが、
          誤りが含まれる可能性があります。
        </p>
        <p className="text-gray-700 leading-relaxed">
          正確性に疑問がある場合は、記事内の出典リンクから公式ソースを直接ご確認ください。
          誤りを見つけた場合は、記事下部の「誤りを報告」リンクからご連絡ください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">情報ソース</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Anthropic 公式ニュース</li>
          <li>Claude API リリースノート</li>
          <li>Claude Code GitHub Releases</li>
          <li>Claude Code CHANGELOG</li>
          <li>Anthropic Engineering Blog</li>
          <li>Anthropic Research</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          記事のファクトチェック基準
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 mt-0.5">
              検証済み
            </span>
            <p className="text-sm text-gray-700">
              スコア85点以上。すべての事実主張がソースと一致し、数値・日付に誤りなし
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 mt-0.5">
              一部未確認あり
            </span>
            <p className="text-sm text-gray-700">
              スコア60-84点。一部の情報に未確認要素あり。編集者が確認の上で公開
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
