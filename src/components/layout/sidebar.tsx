"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  BarChart2,
  Settings,
  TrendingUp,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Sidebar, SidebarBody, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/goals", label: "Investimentos", icon: BarChart2 },
];

/** Shared animated label — fades out without affecting layout */
function AnimatedLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, animate } = useSidebar();
  return (
    <motion.span
      animate={{
        opacity: animate ? (open ? 1 : 0) : 1,
        width: animate ? (open ? "auto" : 0) : "auto",
      }}
      transition={{ duration: 0.15 }}
      className={cn("overflow-hidden whitespace-nowrap", className)}
    >
      {children}
    </motion.span>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  const pathname = usePathname();
  const { open, animate } = useSidebar();
  const isActive = pathname === href;
  const collapsed = animate && !open;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors group/sidebar",
        collapsed && "justify-center gap-0",
        isActive
          ? "bg-blue-600/10 border border-blue-500/20"
          : "border border-transparent hover:bg-zinc-800/50"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-blue-400"
            : "text-zinc-500 group-hover/sidebar:text-zinc-300"
        )}
      />
      <AnimatedLabel
        className={cn(
          "text-sm",
          isActive
            ? "text-blue-400"
            : "text-zinc-400 group-hover/sidebar:text-zinc-200"
        )}
      >
        {label}
      </AnimatedLabel>
    </Link>
  );
}

function SettingsLink() {
  const pathname = usePathname();
  const { open, animate } = useSidebar();
  const isActive = pathname === "/dashboard/settings";
  const collapsed = animate && !open;

  return (
    <Link
      href="/dashboard/settings"
      className={cn(
        "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors border group/sidebar",
        collapsed && "justify-center gap-0",
        isActive
          ? "bg-blue-600/10 border-blue-500/20 text-blue-400"
          : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      )}
    >
      <Settings className="h-4 w-4 shrink-0" />
      <AnimatedLabel className="text-sm">Configurações</AnimatedLabel>
    </Link>
  );
}

function LogoutButton() {
  const { open, animate } = useSidebar();
  const collapsed = animate && !open;

  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        className={cn(
          "flex items-center gap-2 px-2 py-2 w-full rounded-lg transition-colors border border-transparent text-zinc-500 hover:text-red-400 hover:bg-red-500/5 group/sidebar",
          collapsed && "justify-center gap-0"
        )}
      >
        <LogOut className="h-4 w-4 shrink-0 transition-colors group-hover/sidebar:text-red-400" />
        <AnimatedLabel className="text-sm">Sair da conta</AnimatedLabel>
      </button>
    </form>
  );
}

function UserAvatar({ email }: { email: string }) {
  const { open, animate } = useSidebar();
  const initial = email[0]?.toUpperCase() ?? "U";
  const collapsed = animate && !open;

  return (
    <div className={cn("flex items-center gap-2 px-2 py-2", collapsed && "justify-center gap-0")}>
      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-md shadow-blue-600/20">
        {initial}
      </div>
      <AnimatedLabel className="text-xs text-zinc-500 truncate max-w-[160px]">
        {email}
      </AnimatedLabel>
    </div>
  );
}

function AppSidebarContent({ userEmail }: { userEmail: string }) {
  const { open, animate } = useSidebar();

  return (
    <SidebarBody className="justify-between gap-6">
      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {/* Logo */}
        <div className={cn("flex items-center gap-2 px-1 py-1 mb-6", !open && animate && "justify-center gap-0")}>
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <motion.div
            animate={{
              opacity: animate ? (open ? 1 : 0) : 1,
              width: animate ? (open ? "auto" : 0) : "auto",
            }}
            transition={{ duration: 0.15 }}
            className="flex flex-col min-w-0 overflow-hidden"
          >
            <span className="font-semibold text-white text-sm tracking-tight whitespace-nowrap">
              FinanceOS
            </span>
            <span className="text-[10px] text-zinc-500 leading-none mt-0.5 whitespace-nowrap">
              Personal Finance
            </span>
          </motion.div>
        </div>

        {/* Nav label */}
        <motion.p
          animate={{
            opacity: animate ? (open ? 1 : 0) : 1,
            height: animate ? (open ? "auto" : 0) : "auto",
          }}
          transition={{ duration: 0.15 }}
          className="text-[10px] text-zinc-600 uppercase tracking-widest px-2 mb-2 whitespace-pre overflow-hidden"
        >
          Menu
        </motion.p>

        {/* Nav items */}
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-0.5 border-t border-zinc-800/60 pt-3">
        <UserAvatar email={userEmail} />
        <SettingsLink />
        <LogoutButton />
      </div>
    </SidebarBody>
  );
}

export function AppSidebar({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <AppSidebarContent userEmail={userEmail} />
    </Sidebar>
  );
}
