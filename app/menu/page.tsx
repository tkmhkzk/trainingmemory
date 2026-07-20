"use client";

import { useEffect, useState } from "react";
import MenuItemForm from "@/components/menu/MenuItemForm";
import Nav from "@/components/Nav";
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, subscribe } from "@/lib/storage";
import { BODY_PARTS, BODY_PART_COLORS } from "@/types";
import type { MenuItem, BodyPart } from "@/types";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    setItems(getMenuItems());
    const unsub = subscribe(() => setItems(getMenuItems()));
    return unsub;
  }, []);

  function handleSave(name: string, bodyPart: BodyPart) {
    if (editItem) {
      updateMenuItem(editItem.id, name, bodyPart);
    } else {
      addMenuItem(name, bodyPart);
    }
    setShowForm(false);
    setEditItem(null);
    setItems(getMenuItems());
  }

  function handleDelete(id: string) {
    if (!confirm("削除しますか？")) return;
    deleteMenuItem(id);
    setItems(getMenuItems());
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

      <Nav />
    </div>
  );
}
