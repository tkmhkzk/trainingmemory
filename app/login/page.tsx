"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { syncNow } from "@/lib/sync";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = getSupabase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("メールアドレスまたはパスワードが違います");
        setLoading(false);
        return;
      }
      await syncNow();
      router.push("/settings");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`接続エラー: ${msg}`);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💪</div>
          <h1 className="text-2xl font-bold text-gray-900">Training Memo</h1>
          <p className="text-gray-500 text-sm mt-1">
            ログインすると記録がクラウドにバックアップされ、
            <br />
            別の端末からも見られるようになります
          </p>
        </div>

        {!supabase ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-sm text-gray-500">
              クラウド同期は現在利用できません。
              <br />
              記録はこの端末に保存されます。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-3 text-base font-semibold disabled:opacity-50 active:bg-blue-700"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        )}

        <Link
          href="/calendar"
          className="block text-center text-sm text-gray-400 mt-6 active:text-gray-600"
        >
          ログインせずに使う
        </Link>
      </div>
    </div>
  );
}
