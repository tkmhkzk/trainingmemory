import { createClient } from "@/lib/supabase-server";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import Nav from "@/components/Nav";
import type { WorkoutSession } from "@/types";
import Link from "next/link";

export default async function CalendarPage() {
  let user = null;
  let sessions: WorkoutSession[] = [];

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user ?? null;

    const { data } = await supabase
      .from("workout_sessions")
      .select(`
        id, date,
        exercise_logs (
          id, menu_item_id, custom_name,
          menu_item:menu_items (id, name, body_part),
          set_records (id, weight, reps, sort_order)
        )
      `)
      .order("date", { ascending: false });
    sessions = (data as unknown as WorkoutSession[]) ?? [];
  } catch {
    // env vars not set or Supabase unreachable - render static UI
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-100 pt-safe px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)` }}>
        <h1 className="text-lg font-bold text-gray-900">Training Memo</h1>
        {user ? (
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-gray-400 active:text-gray-600">ログアウト</button>
          </form>
        ) : (
          <Link href="/login" className="text-sm text-blue-600 font-medium">ログイン</Link>
        )}
      </header>

      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="bg-white mb-3">
          <CalendarGrid sessions={sessions} />
        </div>

        {user && (
          <div className="px-4">
            <Link
              href={`/log/${today}`}
              className="block w-full bg-blue-600 text-white text-center py-3.5 rounded-2xl font-semibold text-base active:bg-blue-700"
            >
              今日のトレーニングを記録
            </Link>
          </div>
        )}
      </div>

      <Nav isAuthed={!!user} />
    </div>
  );
}
