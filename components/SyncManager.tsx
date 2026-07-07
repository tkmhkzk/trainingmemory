"use client";

import { useEffect } from "react";
import { subscribe } from "@/lib/storage";
import { scheduleSync, syncNow } from "@/lib/sync";
import { getSupabase } from "@/lib/supabase";

// 画面には何も描画せず、ローカル変更・ログイン状態・画面復帰を監視して同期する
export default function SyncManager() {
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    void syncNow();
    const unsubStorage = subscribe(() => scheduleSync());
    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") void syncNow();
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncNow();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsubStorage();
      authSub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
