"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, CalendarClock, ClipboardList, LayoutDashboard, LogOut, MessageCircle, MessageSquareText, Send, Settings, Tags, Target, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/captar", label: "Captar leads", icon: Target },
  { href: "/leads", label: "Leads", icon: ClipboardList },
  { href: "/conversao", label: "Conversao", icon: TrendingUp },
  { href: "/conversas", label: "Conversas", icon: MessageCircle },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { href: "/mensagens", label: "Mensagens", icon: MessageSquareText },
  { href: "/nichos", label: "Nichos", icon: Tags },
  { href: "/kanban", label: "Kanban", icon: BarChart3 },
  { href: "/automacao", label: "Automacao", icon: Bot },
  { href: "/propostas", label: "Propostas", icon: Send },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings }
];

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:block">
          <div>
            <p className="text-lg font-bold text-slate-950">CRM Sites</p>
            <p className="truncate text-xs text-slate-500">{userEmail}</p>
          </div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={signOut} aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-3 right-3 hidden lg:block">
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>
      <main className="w-full p-4 lg:ml-64 lg:p-8">{children}</main>
    </div>
  );
}
