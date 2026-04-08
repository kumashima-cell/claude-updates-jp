"use client";

import { useState, useEffect } from "react";
import type { Article } from "@/types";
import { CategoryBadge, FactCheckBadge } from "@/components/Badges";

export default function AdminPage() {
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState("");

  useEffect(() => {
    fetchDrafts();
  }, []);

  async function fetchDrafts() {
    try {
      const res = await fetch("/api/admin/drafts");
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function publishArticle(id: string) {
    if (!secret) {
      alert("Admin Secretを入力してください");
      return;
    }

    const res = await fetch(`/api/articles/${id}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });

    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert("公開に失敗しました");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">管理画面</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Admin Secret
        </label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
          placeholder="ADMIN_SECRET"
        />
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">
        レビュー待ち記事 ({drafts.length})
      </h2>

      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : drafts.length === 0 ? (
        <p className="text-gray-500">レビュー待ちの記事はありません</p>
      ) : (
        <div className="space-y-4">
          {drafts.map((article) => (
            <div
              key={article.id}
              className="border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <CategoryBadge category={article.category} />
                <FactCheckBadge score={article.fact_check_score} />
                <span className="text-xs text-gray-500 ml-auto">
                  スコア: {article.fact_check_score}/100
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {article.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {article.description}
              </p>

              {article.fact_check_issues.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3 text-sm">
                  <p className="font-medium text-yellow-800 mb-1">
                    ファクトチェック指摘:
                  </p>
                  <ul className="list-disc list-inside text-yellow-700">
                    {article.fact_check_issues.map((issue, i) => (
                      <li key={i}>
                        [{issue.severity}] {issue.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details className="mb-3">
                <summary className="text-sm text-blue-600 cursor-pointer">
                  記事本文を表示
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                  {article.content}
                </pre>
              </details>

              <div className="flex gap-2">
                <button
                  onClick={() => publishArticle(article.id!)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  公開する
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
