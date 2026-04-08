export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="font-medium text-gray-700">Claude Updates JP</p>
            <p>Anthropic/Claude の最新情報を自動収集・解説</p>
          </div>
          <div className="text-right">
            <p>
              AI支援により作成、編集者が監修しています
            </p>
            <p className="mt-1">
              情報の正確性は公式ソースでご確認ください
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
