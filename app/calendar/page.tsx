"use client";

import { useEffect, useState } from "react";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import Nav from "@/components/Nav";
import { getAllSessions, todayStr } from "@/lib/storage";
import type { WorkoutSession } from "@/types";
import Link from "next/link";

export default function CalendarPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    setSessions(getAllSessions());
  }, []);

  const today = todayStr();

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-100 pt-safe px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)` }}>
        <h1 className="text-lg font-bold text-gray-900">Training Memo</h1>
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
