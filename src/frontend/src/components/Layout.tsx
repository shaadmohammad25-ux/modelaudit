import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusSquare,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Audit", href: "/audit/new", icon: PlusSquare },
  { label: "Reports", href: "/reports", icon: FileText, disabled: true },
  { label: "History", href: "/history", icon: History, disabled: true },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function Layout({ children, pageTitle }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clear, identity } = useInternetIdentity();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const principalShort = identity
    ? `${identity.getPrincipal().toText().slice(0, 12)}…`
    : "";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyUp={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card transition-smooth lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            ModelAudit
          </span>
          <button
            type="button"
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-2 py-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentPath === item.href ||
              currentPath.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return item.disabled ? (
              <div
                key={item.href}
                className="flex items-center gap-3 rounded px-3 py-2.5 text-sm text-muted-foreground/50 cursor-not-allowed select-none"
                title="Coming soon"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs font-mono text-muted-foreground/40">
                  soon
                </span>
              </div>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
                className={`
                  flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-smooth
                  ${
                    isActive
                      ? "bg-primary/15 text-primary font-medium border-l-2 border-primary pl-[10px]"
                      : "text-foreground/70 hover:bg-accent/10 hover:text-foreground"
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-3">
          {identity && (
            <div className="flex items-center gap-2 px-1">
              <div className="h-6 w-6 rounded-full bg-secondary/30 border border-secondary/50 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-mono text-secondary-foreground">
                  {principalShort.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground truncate min-w-0">
                {principalShort}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={clear}
            data-ocid="nav.logout.button"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6 flex-shrink-0">
          <button
            type="button"
            className="lg:hidden text-muted-foreground hover:text-foreground transition-smooth"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            data-ocid="nav.menu.button"
          >
            <Menu className="h-5 w-5" />
          </button>
          {pageTitle && (
            <h1 className="font-display text-xl font-semibold text-foreground tracking-tight">
              {pageTitle}
            </h1>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
