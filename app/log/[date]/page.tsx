"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ExerciseEntry from "@/components/log/ExerciseEntry";
import AddExerciseSheet from "@/components/log/AddExerciseSheet";
import Nav from "@/components/Nav";
import type { ExerciseLog, MenuItem, WorkoutSession } from "@/types";

export default function LogPage() {
  const params = useParams();
  const date = params.date as string;
  const router = useRouter();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      loadData(supabase);
    });
  }, [date]);

  async function loadData(supabase: ReturnType<typeof createClient>) {
    const [menuRes, sessionRes] = await Promise.all([
      supabase.from("menu_items").select("*").order("body_part").order("name"),
      supabase
        .from("workout_sessions")
        .select(`
          id, date,
          exercise_logs (
            id, session_id, menu_item_id, custom_name, sort_order,
            menu_item:menu_items (id, name, body_part),
            set_records (id, exercise_log_id, weight, reps, sort_order)
          )
        `)
        .eq("date", date)
        .maybeSingle(),
    ]);
    setMenuItems((menuRes.data as MenuItem[]) ?? []);
    if (sessionRes.data) {
      const s = sessionRes.data as unknown as WorkoutSession;
      s.exercise_logs = (s.exercise_logs ?? []).sort((a, b) => a.sort_order - b.sort_order);
      setSession(s);
    } else {
      setSession({ id: "", date, exercise_logs: [] });
    }
    setLoaded(true);
  }

  async function saveAll(updated: WorkoutSession) {
    setSaving(true);
    const supabase = createClient();

    let sessionId = updated.id;
    if (!sessionId) {
      const { data } = await supabase
        .from("workout_sessions")
        .upsert({ date }, { onConflict: "date" })
        .select("id")
        .single();
      sessionId = data!.id;
      updated = { ...updated, id: sessionId };
      setSession(updated);
    }

    for (let i = 0; i < (updated.exercise_logs ?? []).length; i++) {
      const log = updated.exercise_logs![i];
      let logId = log.id;
      if (!logId || logId.startsWith("tmp_")) {
        const { data } = await supabase
          .from("exercise_logs")
          .upsert({
            id: logId.startsWith("tmp_") ? undefined : logId,
            session_id: sessionId,
            menu_item_id: log.menu_item_id,
            custom_name: log.custom_name,
            sort_order: i,
          })
          .select("id")
          .single();
        logId = data!.id;
        updated.exercise_logs![i] = { ...log, id: logId, session_id: sessionId };
      } else {
        await supabase
          .from("exercise_logs")
          .update({ custom_name: log.custom_name, sort_order: i })
          .eq("id", logId);
      }

      const existingSets = (log.set_records ?? []).filter((s) => !s.id.startsWith("tmp_"));
      const newSets = (log.set_records ?? []).filter((s) => s.id.startsWith("tmp_"));

      for (const s of existingSets) {
        await supabase.from("set_records").upsert({
          id: s.id,
          exercise_log_id: logId,
          weight: s.weight,
          reps: s.reps,
          sort_order: s.sort_order,
        });
      }
      for (let j = 0; j < newSets.length; j++) {
        const s = newSets[j];
        const { data } = await supabase.from("set_records").insert({
          exercise_log_id: logId,
          weight: s.weight,
          reps: s.reps,
          sort_order: existingSets.length + j,
        }).select("id").single();
        const idx = updated.exercise_logs![i].set_records!.findIndex((x) => x.id === s.id);
        if (idx >= 0) updated.exercise_logs![i].set_records![idx] = { ...s, id: data!.id };
      }
    }

    setSession({ ...updated });
    setSaving(false);
  }

  function updateLog(index: number, updated: ExerciseLog) {
    if (!session) return;
    const logs = [...(session.exercise_logs ?? [])];
    logs[index] = updated;
    const newSession = { ...session, exercise_logs: logs };
    setSession(newSession);
    saveAll(newSession);
  }

  async function deleteLog(index: number) {
    if (!session) return;
    const log = session.exercise_logs![index];
    const supabase = createClient();
    if (log.id && !log.id.startsWith("tmp_")) {
      await supabase.from("exercise_logs").delete().eq("id", log.id);
    }
    const logs = session.exercise_logs!.filter((_, i) => i !== index);
    setSession({ ...session, exercise_logs: logs });
  }

  async function addExercise(item: MenuItem) {
    if (!session) return;
    const supabase = createClient();
    let sessionId = session.id;
    if (!sessionId) {
      const { data } = await supabase
        .from("workout_sessions")
        .upsert({ date }, { onConflict: "date" })
        .select("id").single();
      sessionId = data!.id;
    }
    const { data } = await supabase
      .from("exercise_logs")
      .insert({
        session_id: sessionId,
        menu_item_id: item.id,
        sort_order: (session.exercise_logs ?? []).length,
      })
      .select("id").single();
    const newLog: ExerciseLog = {
      id: data!.id,
      session_id: sessionId,
      menu_item_id: item.id,
      custom_name: null,
      sort_order: (session.exercise_logs ?? []).length,
      menu_item: item,
      set_records: [],
    };
    setSession({ ...session, id: sessionId, exercise_logs: [...(session.exercise_logs ?? []), newLog] });
  }

  const [m, d] = date.split("-").slice(1);
  const dateLabel = `${parseInt(m)}月${parseInt(d)}日`;
  const isToday = date === new Date().toISOString().split("T")[0];

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
        {saving && <span className="text-xs text-gray-400 ml-auto">保存中...</span>}
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

      <Nav isAuthed={!!user} />

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
