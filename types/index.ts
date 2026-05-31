export type BodyPart = "胸" | "背中" | "脚" | "肩" | "腕" | "体幹" | "有酸素";

export const BODY_PARTS: BodyPart[] = ["胸", "背中", "脚", "肩", "腕", "体幹", "有酸素"];

export const BODY_PART_COLORS: Record<BodyPart, string> = {
  胸: "bg-red-400",
  背中: "bg-blue-400",
  脚: "bg-green-400",
  肩: "bg-yellow-400",
  腕: "bg-purple-400",
  体幹: "bg-orange-400",
  有酸素: "bg-pink-400",
};

export interface MenuItem {
  id: string;
  name: string;
  body_part: BodyPart;
  created_at?: string;
}

export interface SetRecord {
  id: string;
  exercise_log_id: string;
  weight: number;
  reps: number;
  sort_order: number;
}

export interface ExerciseLog {
  id: string;
  session_id: string;
  menu_item_id: string;
  custom_name: string | null;
  sort_order: number;
  created_at?: string;
  set_records?: SetRecord[];
  menu_item?: MenuItem;
}

export interface WorkoutSession {
  id: string;
  date: string;
  created_at?: string;
  exercise_logs?: ExerciseLog[];
}
