"use client";

import { useEffect, useState } from "react";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import Nav from "@/components/Nav";
import { getAllSessions, todayStr, subscribe } from "@/lib/storage";
import type { WorkoutSession } from "@/types";
import Link from "next/link";

export default function CalendarPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    setSessions(getAllSessions());
    const unsub = subscribe(() => setSessions(getAllSessions()));
    return unsub;
  }, []);

  const today = todayStr();

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-100 pt-safe px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)` }}>
        <h1 className="text-lg font-bold text-gray-900">Training Memo</h1>
        <Link
          href="/settings"
          className="text-gray-400 active:text-gray-600 p-1"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="bg-white mb-3">
          <CalendarGrid sessions={sessions} />
        </div>

        <div className="px-4">
          <Link
            href={`/log/${today}`}
            className="block w-full bg-blue-600 text-white text-center py-3.5 rounded-2xl font-semibold text-base active:bg-blue-700"
          >
            今日のトレーニングを記録
          </Link>
        </div>
      </div>

      <Nav />
    </div>
  );
}
