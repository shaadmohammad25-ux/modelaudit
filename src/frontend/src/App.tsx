import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import AuditResultsPage from "./pages/AuditResultsPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
// ─── Pages (lazy-like inline stubs, real pages imported directly) ──────────
import LoginPage from "./pages/LoginPage";
import NewAuditPage from "./pages/NewAuditPage";

// Auth guard wrapper
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="font-mono text-xs text-muted-foreground tracking-widest">
            INITIALIZING
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

// ─── Layout wrapper for authenticated routes ────────────────────────────────
import { Layout } from "./components/Layout";

function DashboardLayout() {
  return (
    <AuthGuard>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGuard>
  );
}

// ─── Route tree ─────────────────────────────────────────────────────────────

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth",
  component: DashboardLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const auditNewRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/audit/new",
  component: NewAuditPage,
});

const auditDetailRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/audit/$id",
  component: AuditResultsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authLayoutRoute.addChildren([
    dashboardRoute,
    auditNewRoute,
    auditDetailRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
