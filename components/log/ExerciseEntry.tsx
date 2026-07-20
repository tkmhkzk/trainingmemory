"use client";

import { useState, useMemo } from "react";
import SetRow from "./SetRow";
import PastRecordsPanel from "./PastRecordsPanel";
import { getPastRecords } from "@/lib/storage";
import type { ExerciseLog, SetRecord } from "@/types";

interface Props {
  log: ExerciseLog;
  date: string;
  onUpdate: (updated: ExerciseLog) => void;
  onDelete: () => void;
}

export default function ExerciseEntry({ log, date, onUpdate, onDelete }: Props) {
  const [editingName, setEditingName] = useState(false);
  const displayName = log.custom_name || log.menu_item?.name || "種目";
  const sets = (log.set_records ?? []).sort((a, b) => a.sort_order - b.sort_order);

  const last = useMemo(() => getPastRecords(log.menu_item_id, date, 1)[0], [log.menu_item_id, date]);

  const lastLabel = useMemo(() => {
    if (!last?.exercise_logs?.[0]?.set_records?.length) return "";
    const dateObj = new Date(last.date + "T00:00:00");
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const sets = last.exercise_logs[0].set_records
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => `${s.weight}kg×${s.reps}`)
      .join(" ");
    return `${month}/${day} ${sets}`;
  }, [last]);

  function updateSet(index: number, weight: number, reps: number) {
    const updated = sets.map((s, i) => i === index ? { ...s, weight, reps } : s);
    onUpdate({ ...log, set_records: updated });
  }

  function deleteSet(index: number) {
    const updated = sets.filter((_, i) => i !== index);
    onUpdate({ ...log, set_records: updated });
  }

  function addSet() {
    const last = sets[sets.length - 1];
    const newSet: SetRecord = {
      id: crypto.randomUUID(),
      exercise_log_id: log.id,
      weight: last?.weight ?? 0,
      reps: last?.reps ?? 10,
      sort_order: sets.length,
    };
    onUpdate({ ...log, set_records: [...sets, newSet] });
  }

  function updateName(name: string) {
    onUpdate({ ...log, custom_name: name || null });
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          {editingName ? (
            <input
              autoFocus
              defaultValue={log.custom_name || log.menu_item?.name || ""}
              onBlur={(e) => { updateName(e.target.value); setEditingName(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="text-base font-semibold w-full border-b border-blue-400 focus:outline-none pb-0.5"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-base font-semibold text-gray-900 text-left"
            >
              {displayName}
              <span className="ml-1.5 text-xs text-gray-300">✏️</span>
            </button>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{log.menu_item?.body_part}</p>
          {lastLabel && (
            <p className="text-xs text-blue-400 mt-0.5">
              前回 {lastLabel}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-gray-300 active:text-red-400 ml-2 p-1"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      <PastRecordsPanel menuItemId={log.menu_item_id} currentDate={date} />

      <div className="mt-2">
        <div className="flex text-xs text-gray-400 px-6 gap-2 mb-1">
          <span className="flex-1 text-center">重量</span>
          <span className="flex-1 text-center">回数</span>
          <span className="w-8" />
        </div>
        {sets.map((set, i) => (
          <SetRow
            key={set.id}
            index={i}
            weight={set.weight}
            reps={set.reps}
            onChange={(w, r) => updateSet(i, w, r)}
            onDelete={() => deleteSet(i)}
          />
        ))}
      </div>

      <button
        onClick={addSet}
        className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 active:bg-gray-50"
      >
        + セットを追加
      </button>
    </div>
  );
}
