"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getSupabase } from "@/lib/supabase";
import { syncNow, resetSyncMeta, getSyncState, subscribeSyncState, type SyncState } from "@/lib/sync";
import { exportData, importData, clearAllData, getAllSessions } from "@/lib/storage";

function formatTime(iso: string | null): string {
  if (!iso) return "未同期";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<SyncState["status"], string> = {
  disabled: "クラウド同期は利用できません",
  signed_out: "未ログイン",
  syncing: "同期中...",
  synced: "同期済み",
  error: "同期エラー",
};

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({ status: "signed_out", lastSyncedAt: null });
  const [message, setMessage] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const supabase = getSupabase();

  useEffect(() => {
    setSyncState(getSyncState());
    setSessionCount(getAllSessions().length);
    const unsub = subscribeSyncState(setSyncState);
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setEmail(data.session?.user.email ?? null);
        setAuthLoaded(true);
      });
    } else {
      setAuthLoaded(true);
    }
    return unsub;
  }, [supabase]);

  async function handleSignOut() {
    if (!supabase) return;
    if (!confirm("ログアウトしますか？\n（この端末の記録はそのまま残ります）")) return;
    await supabase.auth.signOut();
    resetSyncMeta();
    setEmail(null);
  }

  function handleExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training-memo-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { sessions, menus } = importData(String(reader.result));
        setSessionCount(getAllSessions().length);
        setMessage(`読み込みました（記録${sessions}日分・メニュー${menus}件）`);
      } catch {
        setMessage("読み込みに失敗しました。バックアップファイルを確認してください");
      }
    };
    reader.readAsText(file);
  }

  function handleClearAll() {
    if (!confirm("この端末の記録をすべて削除しますか？")) return;
    if (!confirm("本当に削除しますか？この操作は取り消せません")) return;
    clearAllData();
    setSessionCount(0);
    setMessage("この端末の記録を削除しました");
  }

  return (
    <div className="flex flex-col h-full">
      <header
        className="bg-white border-b border-gray-100 px-4 py-3"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)` }}
      >
        <h1 className="text-base font-semibold text-gray-900">設定</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="p-4 space-y-4">
          {/* アカウント・同期 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">アカウント</h2>
            {!authLoaded ? (
              <p className="text-sm text-gray-400">読み込み中...</p>
            ) : email ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base text-gray-800">{email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {STATUS_LABEL[syncState.status]}
                      {syncState.status === "synced" && ` ・ 最終同期 ${formatTime(syncState.lastSyncedAt)}`}
                    </p>
                    {syncState.status === "error" && (
                      <p className="text-xs text-red-400 mt-0.5">{syncState.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void syncNow()}
                    disabled={syncState.status === "syncing"}
                    className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium disabled:opacity-50 active:bg-blue-100"
                  >
                    今すぐ同期
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 active:bg-gray-50"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  記録はこの端末に保存されています。
                  ログインするとクラウドにバックアップされ、別の端末からも見られます。
                </p>
                <Link
                  href="/login"
                  className="block w-full bg-blue-600 text-white text-center py-2.5 rounded-xl text-sm font-semibold active:bg-blue-700"
                >
                  ログイン
                </Link>
              </div>
            )}
          </section>

          {/* データ管理 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 mb-1">データ管理</h2>
            <p className="text-xs text-gray-400 mb-3">この端末の記録: {sessionCount}日分</p>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 active:bg-gray-50"
              >
                バックアップファイルを保存（エクスポート）
              </button>
              <button
                onClick={() => fileInput.current?.click()}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 active:bg-gray-50"
              >
                バックアップから復元（インポート）
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                  e.target.value = "";
                }}
              />
              <button
                onClick={handleClearAll}
                className="w-full py-2.5 rounded-xl border border-red-100 text-sm text-red-400 active:bg-red-50"
              >
                この端末の記録をすべて削除
              </button>
            </div>
            {message && <p className="text-xs text-blue-500 mt-3">{message}</p>}
          </section>
        </div>
      </div>

      <Nav />
    </div>
  );
}
