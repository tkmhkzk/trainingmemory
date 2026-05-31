"use client";

interface Props {
  weight: number;
  reps: number;
  index: number;
  onChange: (weight: number, reps: number) => void;
  onDelete: () => void;
}

export default function SetRow({ weight, reps, index, onChange, onDelete }: Props) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-gray-400 w-6 text-center">{index + 1}</span>
      <div className="flex flex-1 gap-2">
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
          <input
            type="number"
            inputMode="decimal"
            value={weight || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0, reps)}
            className="flex-1 bg-transparent px-3 py-2.5 text-base text-center focus:outline-none"
            placeholder="0"
          />
          <span className="text-xs text-gray-400 pr-2">kg</span>
        </div>
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
          <input
            type="number"
            inputMode="numeric"
            value={reps || ""}
            onChange={(e) => onChange(weight, parseInt(e.target.value) || 0)}
            className="flex-1 bg-transparent px-3 py-2.5 text-base text-center focus:outline-none"
            placeholder="0"
          />
          <span className="text-xs text-gray-400 pr-2">回</span>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="w-8 h-8 flex items-center justify-center text-gray-300 active:text-red-400"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
