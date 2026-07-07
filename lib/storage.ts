import { BODY_PARTS } from "@/types";
import type { BodyPart, MenuItem, WorkoutSession } from "@/types";

// 端末のlocalStorageのみにデータを保持する（サーバー送信なし）
const MENU_KEY = "tm:menu_items";
const MENU_SEEDED_KEY = "tm:menu_seeded";
const SESSIONS_KEY = "tm:sessions";

const DEFAULT_MENUS: { name: string; body_part: BodyPart }[] = [
  { name: "ベンチプレス", body_part: "胸" },
  { name: "ダンベルフライ", body_part: "胸" },
  { name: "ペックデック", body_part: "胸" },
  { name: "懸垂", body_part: "背中" },
  { name: "ラットプルダウン", body_part: "背中" },
  { name: "シーテッドロウ", body_part: "背中" },
  { name: "スクワット", body_part: "脚" },
  { name: "レッグプレス", body_part: "脚" },
  { name: "ルーマニアンデッドリフト", body_part: "脚" },
  { name: "ショルダープレス", body_part: "肩" },
  { name: "サイドレイズ", body_part: "肩" },
  { name: "バーベルカール", body_part: "腕" },
  { name: "トライセプスプレスダウン", body_part: "腕" },
  { name: "プランク", body_part: "体幹" },
  { name: "ランニング", body_part: "有酸素" },
];

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sortMenuItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => {
    const d = BODY_PARTS.indexOf(a.body_part) - BODY_PARTS.indexOf(b.body_part);
    return d !== 0 ? d : a.name.localeCompare(b.name, "ja");
  });
}

export function getMenuItems(): MenuItem[] {
  const items = read<MenuItem[]>(MENU_KEY, []);
  if (items.length === 0 && !read(MENU_SEEDED_KEY, false)) {
    const seeded: MenuItem[] = DEFAULT_MENUS.map((m) => ({
      id: crypto.randomUUID(),
      ...m,
    }));
    write(MENU_KEY, seeded);
    write(MENU_SEEDED_KEY, true);
    return sortMenuItems(seeded);
  }
  return sortMenuItems(items);
}

export function addMenuItem(name: string, body_part: BodyPart): MenuItem {
  const items = read<MenuItem[]>(MENU_KEY, []);
  const item: MenuItem = { id: crypto.randomUUID(), name, body_part };
  write(MENU_KEY, [...items, item]);
  return item;
}

export function updateMenuItem(id: string, name: string, body_part: BodyPart) {
  const items = read<MenuItem[]>(MENU_KEY, []);
  write(
    MENU_KEY,
    items.map((m) => (m.id === id ? { ...m, name, body_part } : m))
  );
}

export function deleteMenuItem(id: string) {
  const items = read<MenuItem[]>(MENU_KEY, []);
  write(
    MENU_KEY,
    items.filter((m) => m.id !== id)
  );
}

type SessionMap = Record<string, WorkoutSession>;

// 保存済みログのmenu_itemスナップショットを最新のメニュー定義で上書きする
// （メニューが削除済みの場合はスナップショットの名前・部位を使い続ける）
function hydrate(session: WorkoutSession, menuById: Map<string, MenuItem>): WorkoutSession {
  return {
    ...session,
    exercise_logs: (session.exercise_logs ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((log) => ({
        ...log,
        menu_item: menuById.get(log.menu_item_id) ?? log.menu_item,
      })),
  };
}

function menuIndex(): Map<string, MenuItem> {
  return new Map(read<MenuItem[]>(MENU_KEY, []).map((m) => [m.id, m]));
}

export function getAllSessions(): WorkoutSession[] {
  const map = read<SessionMap>(SESSIONS_KEY, {});
  const menuById = menuIndex();
  return Object.values(map)
    .map((s) => hydrate(s, menuById))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getSession(date: string): WorkoutSession | null {
  const map = read<SessionMap>(SESSIONS_KEY, {});
  const s = map[date];
  return s ? hydrate(s, menuIndex()) : null;
}

export function saveSession(session: WorkoutSession): WorkoutSession {
  const map = read<SessionMap>(SESSIONS_KEY, {});
  const sessionId = session.id || crypto.randomUUID();
  const logs = (session.exercise_logs ?? []).map((log, i) => {
    const logId = log.id || crypto.randomUUID();
    return {
      ...log,
      id: logId,
      session_id: sessionId,
      sort_order: i,
      set_records: (log.set_records ?? []).map((s, j) => ({
        ...s,
        id: s.id || crypto.randomUUID(),
        exercise_log_id: logId,
        sort_order: j,
      })),
    };
  });
  const saved: WorkoutSession = { ...session, id: sessionId, exercise_logs: logs };
  if (logs.length === 0) {
    delete map[session.date];
  } else {
    map[session.date] = saved;
  }
  write(SESSIONS_KEY, map);
  return saved;
}

// 指定種目の過去の記録（currentDateより前）を新しい順に返す
export function getPastRecords(
  menuItemId: string,
  currentDate: string,
  limit = 5
): WorkoutSession[] {
  const map = read<SessionMap>(SESSIONS_KEY, {});
  const results: WorkoutSession[] = [];
  for (const session of Object.values(map)) {
    if (session.date >= currentDate) continue;
    const logs = (session.exercise_logs ?? []).filter(
      (log) => log.menu_item_id === menuItemId
    );
    if (logs.length > 0) results.push({ ...session, exercise_logs: logs });
  }
  return results
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}
