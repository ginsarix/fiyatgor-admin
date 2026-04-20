import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { useAtom } from "jotai";
import { Home, Menu, Terminal } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { AvatarDropdown } from "@/components/ui/avatar-dropdown";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { axios } from "@/config/api";
import { firmQueryKey } from "@/constants/queryKeys";
import { cn, getInitials } from "@/lib/utils";
import { sessionAtom } from "@/state/atoms/session";
import { store } from "@/state/store";
import type { Session } from "@/types/session";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/login") return;

    const session = store.get(sessionAtom);

    if (!session) {
      try {
        const { data: responseData } = await axios.get<{
          session: Session;
          message: string;
        }>("/auth/sessions/current");

        store.set(sessionAtom, responseData.session);
      } catch (error) {
        console.error("An error occurred while fetching session: ", error);

        throw redirect({
          to: "/login",
          search: {
            redirect: location.pathname,
          },
        });
      }
    }
  },
});

function RootComponent() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [session, setSession] = useAtom(sessionAtom);

  const firmQuery = useQuery({
    queryKey: [firmQueryKey],
    queryFn: async () =>
      (
        await axios.get<{
          message: string;
          firm: { diaServerCode: string | null; diaFirmCode: number | null };
        }>("/admin/firm", { params: { firmCode: session?.firmCode } })
      ).data,
    enabled: !!session,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const hasDiaCredentials = !!(
    firmQuery.data?.firm?.diaServerCode && firmQuery.data?.firm?.diaFirmCode
  );

  const navigate = Route.useNavigate();

  async function logOut() {
    try {
      await axios.delete("/auth/sessions/current");

      setSession(null);
      navigate({ to: "/login", replace: true });
    } catch (error) {
      console.error("An error occurred while logging out: ", error);
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.repeat) return;

      const target = e.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.code === "KeyB") {
        e.preventDefault();
        setDrawerOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* AppBar / Header */}
      <header className="shrink-0 sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-12 items-center">
          {session && (
            <Button
              variant="ghost"
              size="icon"
              className="mx-2 h-8 w-8 shrink-0"
              onClick={() => setDrawerOpen((prev) => !prev)}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

          <h1 className={cn("font-mono text-sm font-bold tracking-tight select-none", !session && "ms-5")}>
            <span className="text-primary">▪</span>{" "}fiyatgör
            <span className="text-muted-foreground font-normal"> / admin</span>
          </h1>

          {session && (
            <div className="ms-auto me-3 shrink-0">
              <AvatarDropdown
                role={session.role}
                initials={getInitials(session.name)}
                logOutFn={logOut}
              />
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Fixed Sidebar */}
        {session && (
          <aside
            className={cn(
              "fixed top-12 left-0 h-[calc(100vh-3rem)] w-56 border-r bg-sidebar z-40 transition-transform duration-200",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <nav className="flex flex-col gap-0.5 px-2 pt-4">
              <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">
                Navigasyon
              </p>

              <Link
                to="/"
                className={cn(
                  "flex items-center gap-2.5 border-l-2 px-3 py-1.5 font-mono text-xs font-normal uppercase tracking-widest transition-colors",
                  location.pathname === "/"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <Home className="h-3.5 w-3.5 shrink-0" />
                Ana Sayfa
              </Link>

              {hasDiaCredentials && (
                <Link
                  to="/commands"
                  className={cn(
                    "flex items-center gap-2.5 border-l-2 px-3 py-1.5 font-mono text-xs font-normal uppercase tracking-widest transition-colors",
                    location.pathname === "/commands"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <Terminal className="h-3.5 w-3.5 shrink-0" />
                  Komutlar
                </Link>
              )}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 grid place-items-center transition-[margin] duration-200",
            session && drawerOpen && "ml-56",
          )}
        >
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
