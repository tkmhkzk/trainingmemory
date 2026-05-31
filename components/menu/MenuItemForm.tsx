"use client";

import { useState } from "react";
import { BODY_PARTS } from "@/types";
import type { BodyPart, MenuItem } from "@/types";

interface Props {
  onSave: (name: string, bodyPart: BodyPart) => void;
  onCancel: () => void;
  initial?: MenuItem;
}

export default function MenuItemForm({ onSave, onCancel, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bodyPart, setBodyPart] = useState<BodyPart>(initial?.body_part ?? "胸");

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="種目名"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <div className="flex flex-wrap gap-2">
        {BODY_PARTS.map((bp) => (
          <button
            key={bp}
            onClick={() => setBodyPart(bp)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              bodyPart === bp
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {bp}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500"
        >
          キャンセル
        </button>
        <button
          onClick={() => name.trim() && onSave(name.trim(), bodyPart)}
          disabled={!name.trim()}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm text-white font-semibold disabled:opacity-50"
        >
          保存
        </button>
      </div>
    </div>
  );
}
