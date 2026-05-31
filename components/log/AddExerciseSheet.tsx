"use client";

import { useState } from "react";
import { BODY_PARTS } from "@/types";
import type { MenuItem } from "@/types";

interface Props {
  menuItems: MenuItem[];
  onAdd: (item: MenuItem) => void;
  onClose: () => void;
}

export default function AddExerciseSheet({ menuItems, onAdd, onClose }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? menuItems.filter((m) => m.name.includes(search) || m.body_part.includes(search))
    : menuItems;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-3xl flex flex-col"
        style={{ maxHeight: "80vh", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold">種目を選ぶ</h2>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-4 pb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="検索..."
            className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-base focus:outline-none border border-gray-100"
          />
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {BODY_PARTS.map((bp) => {
            const items = filtered.filter((m) => m.body_part === bp);
            if (items.length === 0) return null;
            return (
              <div key={bp} className="mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{bp}</h3>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { onAdd(item); onClose(); }}
                      className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl text-base text-gray-800 active:bg-blue-50 active:text-blue-700"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">種目が見つかりません</p>
          )}
        </div>
      </div>
    </div>
  );
}
