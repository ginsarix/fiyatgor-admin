import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAtom } from "jotai";
import { Home, Menu, Terminal } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { AvatarDropdown } from "@/components/ui/avatar-dropdown";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { axios } from "@/config/api";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [session, setSession] = useAtom(sessionAtom);

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
      <header className="shrink-0 sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center">
          {session && (
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mx-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <nav className="flex flex-col gap-4 mt-10">
                  <Link
                    to="/"
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                      location.pathname === "/"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Home className="h-4 w-4" />
                    Ana Sayfa
                  </Link>

                  <Link
                    to="/commands"
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                      location.pathname === "/commands"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Terminal className="h-4 w-4" />
                    Komutlar
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          )}

          <h1 className={cn("text-lg font-semibold", !session && "ms-5")}>
            Fiyatgör Admin
          </h1>

          {session && (
            <div className="ms-auto me-4 shrink-0">
              <AvatarDropdown
                role={session.role}
                initials={getInitials(session.name)}
                logOutFn={logOut}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid place-items-center">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Toaster />
    </div>
  );
}
