import Link from "next/link";
import { toDateStr } from "@/lib/storage";
import { BODY_PART_COLORS } from "@/types";
import type { WorkoutSession, BodyPart } from "@/types";

interface Props {
  date: Date | null;
  session: WorkoutSession | null;
  isToday: boolean;
  dow: number;
}

export default function DayCell({ date, session, isToday, dow }: Props) {
  if (!date) return <div />;

  const dateStr = toDateStr(date);
  const bodyParts = session?.exercise_logs
    ? [...new Set(session.exercise_logs.map((e) => e.menu_item?.body_part).filter(Boolean) as BodyPart[])]
    : [];

  const textColor = dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : "text-gray-800";

  return (
    <Link href={`/log/${dateStr}`} className="flex flex-col items-center py-1.5 rounded-xl active:bg-gray-100">
      <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full
        ${isToday ? "bg-blue-600 text-white" : textColor}`}>
        {date.getDate()}
      </span>
      <div className="flex gap-0.5 mt-0.5 h-2 flex-wrap justify-center">
        {bodyParts.slice(0, 3).map((bp) => (
          <span key={bp} className={`w-1.5 h-1.5 rounded-full ${BODY_PART_COLORS[bp]}`} />
        ))}
      </div>
    </Link>
  );
}
