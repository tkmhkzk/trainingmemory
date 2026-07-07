"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { todayStr } from "@/lib/storage";

export default function Nav() {
  const pathname = usePathname();
  const isLogPage = pathname.startsWith("/log/");
  const todayHref = `/log/${todayStr()}`;

  const tabs = [
    {
      href: "/calendar",
      label: "カレンダー",
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      href: todayHref,
      label: "今日",
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      href: "/menu",
      label: "メニュー",
      icon: (active: boolean) => (
        <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const isToday = tab.href.startsWith("/log/");
          const active = isToday ? isLogPage : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5"
            >
              {tab.icon(active)}
              <span className={`text-xs ${active ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
