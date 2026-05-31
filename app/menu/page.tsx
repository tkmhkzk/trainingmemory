"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import MenuItemForm from "@/components/menu/MenuItemForm";
import Nav from "@/components/Nav";
import { BODY_PARTS, BODY_PART_COLORS } from "@/types";
import type { MenuItem, BodyPart } from "@/types";

const DEFAULT_MENUS: { name: string; body_part: BodyPart }[] = [
  { name: "ベンチプレス", body_part: "胸" },
  { name: "ダンベルフライ", body_part: "胸" },
  { name: "ペックデック", body_part: "胸" },
  { name: "懸垂", body_part: "背中" },
  { name: "ラットプルダウン", body_part: "背中" },
  { name: "シーテッドロウ", body_part: "背中" },
  { name: "スクワット", body_part: "脚" },
  { name: "レッグプレス", body_part: "脚" },
  { name: "ルーマニアンデッドリフト", body_part: "脚" },
  { name: "ショルダープレス", body_part: "肩" },
  { name: "サイドレイズ", body_part: "肩" },
  { name: "バーベルカール", body_part: "腕" },
  { name: "トライセプスプレスダウン", body_part: "腕" },
  { name: "プランク", body_part: "体幹" },
  { name: "ランニング", body_part: "有酸素" },
];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      loadItems(supabase);
    });
  }, []);

  async function loadItems(supabase: ReturnType<typeof createClient>) {
    const { data } = await supabase.from("menu_items").select("*").order("body_part").order("name");
    if (data && data.length === 0) {
      await supabase.from("menu_items").insert(DEFAULT_MENUS);
      const { data: seeded } = await supabase.from("menu_items").select("*").order("body_part").order("name");
      setItems((seeded as MenuItem[]) ?? []);
    } else {
      setItems((data as MenuItem[]) ?? []);
    }
  }

  async function handleSave(name: string, bodyPart: BodyPart) {
    const supabase = createClient();
    if (editItem) {
      await supabase.from("menu_items").update({ name, body_part: bodyPart }).eq("id", editItem.id);
    } else {
      await supabase.from("menu_items").insert({ name, body_part: bodyPart });
    }
    setShowForm(false);
    setEditItem(null);
    loadItems(supabase);
  }

  async function handleDelete(id: string) {
    if (!confirm("削除しますか？")) return;
    const supabase = createClient();
    await supabase.from("menu_items").delete().eq("id", id);
    setItems((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col h-full">
      <header
        className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)` }}
      >
        <h1 className="text-base font-semibold text-gray-900">メニュー管理</h1>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="text-blue-600 text-sm font-medium"
        >
          ＋ 追加
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="p-4 space-y-4">
          {showForm && (
            <MenuItemForm
              initial={editItem ?? undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditItem(null); }}
            />
          )}

          {BODY_PARTS.map((bp) => {
            const group = items.filter((m) => m.body_part === bp);
            if (group.length === 0) return null;
            return (
              <div key={bp}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${BODY_PART_COLORS[bp]}`} />
                  <h2 className="text-sm font-semibold text-gray-500">{bp}</h2>
                </div>
                <div className="space-y-1">
                  {group.map((item) => (
                    <div key={item.id} className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm">
                      <span className="flex-1 text-base text-gray-800">{item.name}</span>
                      <button
                        onClick={() => { setEditItem(item); setShowForm(true); }}
                        className="text-blue-400 text-sm px-2 py-1 active:opacity-60"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 text-sm px-2 py-1 active:opacity-60"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Nav isAuthed={!!user} />
    </div>
  );
}
