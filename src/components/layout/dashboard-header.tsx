import React from "react";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  nav?: React.ReactNode;
  userEmail?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  nav,
  userEmail,
  children,
}: DashboardHeaderProps) {
  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "US";

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
        {nav ?? (subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>)}
      </div>

      <div className="flex items-center gap-3">
        {children}
        <button className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 transition-all">
          <Search className="w-4 h-4" />
        </button>
        <button className="relative w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full ring-1 ring-zinc-900" />
        </button>
        <div className="w-px h-5 bg-zinc-800 mx-1" />
        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarFallback className="bg-blue-600/20 text-blue-400 text-xs font-semibold border border-blue-500/20">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
