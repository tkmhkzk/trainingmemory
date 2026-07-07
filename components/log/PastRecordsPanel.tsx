"use client";

import { useState } from "react";
import { getPastRecords } from "@/lib/storage";
import type { WorkoutSession } from "@/types";

interface Props {
  menuItemId: string;
  currentDate: string;
}

export default function PastRecordsPanel({ menuItemId, currentDate }: Props) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<WorkoutSession[]>([]);

  function load() {
    if (records.length === 0) {
      setRecords(getPastRecords(menuItemId, currentDate));
    }
    setOpen(true);
  }

  return (
    <div>
      <button
        onClick={() => open ? setOpen(false) : load()}
        className="text-xs text-blue-500 flex items-center gap-1 py-1"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="12 8 12 12 14 14" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        {open ? "履歴を閉じる" : "過去の記録を見る"}
      </button>

      {open && (
        <div className="bg-blue-50 rounded-xl p-3 mt-1 space-y-2">
          {records.length === 0 && (
            <p className="text-xs text-gray-400">過去の記録なし</p>
          )}
          {records.map((session) => {
            const log = session.exercise_logs?.[0];
            if (!log) return null;
            const sets = (log.set_records ?? [])
              .sort((a, b) => a.sort_order - b.sort_order);
            const displayName = log.custom_name || "";
            const [m, d] = session.date.split("-").slice(1);
            return (
              <div key={session.id}>
                <p className="text-xs font-medium text-gray-600">
                  {parseInt(m)}月{parseInt(d)}日
                  {displayName && <span className="text-gray-400 ml-1">({displayName})</span>}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {sets.map((s, i) => `${s.weight}kg×${s.reps}`).join("  ")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
