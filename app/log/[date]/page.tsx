"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ExerciseEntry from "@/components/log/ExerciseEntry";
import AddExerciseSheet from "@/components/log/AddExerciseSheet";
import Nav from "@/components/Nav";
import { getMenuItems, getSession, saveSession, todayStr } from "@/lib/storage";
import type { ExerciseLog, MenuItem, WorkoutSession } from "@/types";

export default function LogPage() {
  const params = useParams();
  const date = params.date as string;
  const router = useRouter();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMenuItems(getMenuItems());
    setSession(getSession(date) ?? { id: "", date, exercise_logs: [] });
    setLoaded(true);
  }, [date]);

  function persist(updated: WorkoutSession) {
    setSession(saveSession(updated));
  }

  function updateLog(index: number, updated: ExerciseLog) {
    if (!session) return;
    const logs = [...(session.exercise_logs ?? [])];
    logs[index] = updated;
    persist({ ...session, exercise_logs: logs });
  }

  function deleteLog(index: number) {
    if (!session) return;
    const logs = (session.exercise_logs ?? []).filter((_, i) => i !== index);
    persist({ ...session, exercise_logs: logs });
  }

  function addExercise(item: MenuItem) {
    if (!session) return;
    const logs = session.exercise_logs ?? [];
    const newLog: ExerciseLog = {
      id: crypto.randomUUID(),
      session_id: session.id,
      menu_item_id: item.id,
      custom_name: null,
      sort_order: logs.length,
      menu_item: item,
      set_records: [],
    };
    persist({ ...session, exercise_logs: [...logs, newLog] });
  }

  const [m, d] = date.split("-").slice(1);
  const dateLabel = `${parseInt(m)}月${parseInt(d)}日`;
  const isToday = date === todayStr();

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header
        className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)` }}
      >
        <button onClick={() => router.back()} className="text-blue-600 p-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          {isToday ? "今日のトレーニング" : dateLabel}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="p-4 space-y-3">
          {(session?.exercise_logs ?? []).map((log, i) => (
            <ExerciseEntry
              key={log.id}
              log={log}
              date={date}
              onUpdate={(updated) => updateLog(i, updated)}
              onDelete={() => deleteLog(i)}
            />
          ))}

          {(session?.exercise_logs ?? []).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">💪</div>
              <p className="text-sm">種目を追加してトレーニングを始めよう</p>
            </div>
          )}

          <button
            onClick={() => setShowSheet(true)}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium active:bg-gray-50"
          >
            + 種目を追加
          </button>
        </div>
      </div>

      <Nav />

      {showSheet && (
        <AddExerciseSheet
          menuItems={menuItems}
          onAdd={addExercise}
          onClose={() => setShowSheet(false)}
        />
      )}
    </div>
  );
}
