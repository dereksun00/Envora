"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    name: "Organizations",
    href: "/organizations",
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
  },
  {
    name: "Deals",
    href: "/deals",
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: "Activities",
    href: "/activities",
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] fixed inset-y-0 left-0 bg-[#0d1117] border-r border-[#2a3142] flex flex-col z-50">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[#2a3142]">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-indigo-500/10 text-indigo-400 font-medium text-sm border border-indigo-500/20">
          A
        </div>
        <span className="font-medium text-[15px] text-zinc-200 tracking-tight">Acme CRM</span>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-[9px] rounded-md text-[14px] leading-tight transition-colors duration-200 ${
                isActive
                  ? "bg-[#2a3142]/50 text-zinc-100 font-medium"
                  : "text-zinc-400 font-normal hover:text-zinc-200 hover:bg-[#2a3142]/30"
              }`}
            >
              <div className={`${isActive ? "text-indigo-400" : "text-zinc-500"} transition-colors duration-200 mt-[1px]`}>
                {item.icon}
              </div>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
