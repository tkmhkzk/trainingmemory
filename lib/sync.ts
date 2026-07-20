import { getSupabase } from "@/lib/supabase";
import {
  getSnapshot,
  replaceAll,
  getLocalUpdatedAt,
  type AppData,
} from "@/lib/storage";
import type { MenuItem, WorkoutSession } from "@/types";

// ローカルファースト同期:
// - ローカル(localStorage)が常に一次ストア。ログイン時のみクラウドと同期する
// - 通常は更新時刻の新しい側で全体を上書き（個人利用前提のlast-write-wins）
// - 端末ごとの初回同期のみ、ローカルとクラウドを日付単位でマージする
//   （「端末のみ運用」期間の記録と、昔のクラウド記録を合流させるため）
const SYNC_INIT_KEY = "tm:sync_initialized";
const LAST_SYNCED_KEY = "tm:last_synced";

export type SyncStatus =
  | "disabled" // Supabase未設定
  | "signed_out"
  | "syncing"
  | "synced"
  | "error";

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error?: string;
}

type StateListener = (state: SyncState) => void;
const stateListeners = new Set<StateListener>();
let currentState: SyncState = { status: "signed_out", lastSyncedAt: null };

export function getSyncState(): SyncState {
  if (typeof window !== "undefined" && currentState.lastSyncedAt === null) {
    currentState = { ...currentState, lastSyncedAt: localStorage.getItem(LAST_SYNCED_KEY) };
  }
  return currentState;
}

export function subscribeSyncState(listener: StateListener): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

function setState(state: Partial<SyncState>) {
  currentState = { ...currentState, ...state };
  stateListeners.forEach((l) => l(currentState));
}

function isEmpty(data: AppData): boolean {
  return Object.keys(data.sessions ?? {}).length === 0;
}

// 初回同期時のマージ: セッションは日付単位でローカル優先、
// メニューは名前+部位が同じものをクラウド側IDに寄せて重複を防ぐ
export function mergeData(local: AppData, cloud: AppData): AppData {
  const idMap = new Map<string, string>(); // local menu id -> cloud menu id
  const mergedMenus: MenuItem[] = [...(cloud.menu_items ?? [])];
  for (const lm of local.menu_items ?? []) {
    const match = mergedMenus.find(
      (cm) => cm.name === lm.name && cm.body_part === lm.body_part
    );
    if (match) {
      idMap.set(lm.id, match.id);
    } else {
      mergedMenus.push(lm);
    }
  }

  const remapLog = (log: NonNullable<WorkoutSession["exercise_logs"]>[number]) => {
    const mapped = idMap.get(log.menu_item_id);
    return mapped ? { ...log, menu_item_id: mapped } : log;
  };

  const mergedSessions: Record<string, WorkoutSession> = { ...(cloud.sessions ?? {}) };
  for (const [date, session] of Object.entries(local.sessions ?? {})) {
    mergedSessions[date] = {
      ...session,
      exercise_logs: (session.exercise_logs ?? []).map(remapLog),
    };
  }

  return { menu_items: mergedMenus, sessions: mergedSessions };
}

async function pushToCloud(userId: string, data: AppData, updatedAt: string) {
  const supabase = getSupabase()!;
  const { error } = await supabase.from("app_state").upsert({
    user_id: userId,
    data,
    updated_at: updatedAt,
  });
  if (error) throw new Error(error.message);
}

let syncing = false;
let pendingResync = false;

export async function syncNow(): Promise<SyncState> {
  const supabase = getSupabase();
  if (!supabase) {
    setState({ status: "disabled" });
    return currentState;
  }
  if (typeof window === "undefined") return currentState;
  if (syncing) {
    pendingResync = true;
    return currentState;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    setState({ status: "signed_out" });
    return currentState;
  }

  syncing = true;
  setState({ status: "syncing" });
  try {
    const { data: row, error } = await supabase
      .from("app_state")
      .select("data, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const local = getSnapshot();
    const localUpdatedAt = getLocalUpdatedAt();
    const initialized = localStorage.getItem(SYNC_INIT_KEY) === "1";

    if (!row) {
      // クラウドが空: ローカルに記録があれば送る
      if (localUpdatedAt && !isEmpty(local)) {
        await pushToCloud(user.id, local, localUpdatedAt);
      }
    } else if (!initialized) {
      // この端末での初回同期: ローカルとクラウドをマージして両方に反映
      const cloud = row.data as AppData;
      const merged =
        localUpdatedAt && !isEmpty(local) ? mergeData(local, cloud) : cloud;
      const now = new Date().toISOString();
      replaceAll(merged, now);
      await pushToCloud(user.id, merged, now);
    } else {
      // Postgresの返す時刻表記はISOと異なることがあるため数値で比較する
      const cloudTime = new Date(row.updated_at).getTime();
      const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;
      if (cloudTime > localTime) {
        replaceAll(row.data as AppData, new Date(cloudTime).toISOString());
      } else if (cloudTime < localTime) {
        await pushToCloud(user.id, local, localUpdatedAt!);
      }
    }

    localStorage.setItem(SYNC_INIT_KEY, "1");
    const syncedAt = new Date().toISOString();
    localStorage.setItem(LAST_SYNCED_KEY, syncedAt);
    setState({ status: "synced", lastSyncedAt: syncedAt, error: undefined });
  } catch (e) {
    setState({ status: "error", error: e instanceof Error ? e.message : String(e) });
  } finally {
    syncing = false;
    if (pendingResync) {
      pendingResync = false;
      void syncNow();
    }
  }
  return currentState;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ローカル変更後に呼ぶ。連続入力をまとめて数秒後に同期する
export function scheduleSync(delayMs = 2500) {
  if (!getSupabase()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncNow();
  }, delayMs);
}

// ログアウト時に呼ぶ: 同期関連の端末側フラグを消す（記録自体は残す）
export function resetSyncMeta() {
  localStorage.removeItem(SYNC_INIT_KEY);
  localStorage.removeItem(LAST_SYNCED_KEY);
  setState({ status: "signed_out", lastSyncedAt: null });
}
