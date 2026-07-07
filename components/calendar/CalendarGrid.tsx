"use client";

import { useState } from "react";
import DayCell from "./DayCell";
import { toDateStr } from "@/lib/storage";
import type { WorkoutSession } from "@/types";

interface Props {
  sessions: WorkoutSession[];
}

export default function CalendarGrid({ sessions }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const sessionMap = new Map<string, WorkoutSession>();
  sessions.forEach((s) => sessionMap.set(s.date, s));

  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const monthLabel = `${year}年${month + 1}月`;

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const DOW = ["日", "月", "火", "水", "木", "金", "土"];

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const trainedDays = sessions.filter((s) => s.date.startsWith(monthPrefix) && (s.exercise_logs ?? []).length > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={prev} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-base font-semibold text-gray-800">{monthLabel}</span>
        <button onClick={next} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {trainedDays > 0 && (
        <p className="text-center text-xs text-gray-400 pb-1">今月のトレーニング {trainedDays}日</p>
      )}

      <div className="grid grid-cols-7 px-2">
        {DOW.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
            {d}
          </div>
        ))}
        {cells.map((date, i) => (
          <DayCell
            key={i}
            date={date}
            session={date ? sessionMap.get(toDateStr(date)) ?? null : null}
            isToday={date ? date.toDateString() === today.toDateString() : false}
            dow={date ? date.getDay() : -1}
          />
        ))}
      </div>
    </div>
  );
}
