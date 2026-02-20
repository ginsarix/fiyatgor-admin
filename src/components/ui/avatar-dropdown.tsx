import { Link } from "@tanstack/react-router";
import {
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  Settings2Icon,
  ShieldUserIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeConfig = {
  light: { label: "Açık tema", icon: SunIcon, next: "dark" as const },
  dark: { label: "Koyu tema", icon: MoonIcon, next: "system" as const },
  system: { label: "Sistem teması", icon: MonitorIcon, next: "light" as const },
};

export function AvatarDropdown({
  initials,
  logOutFn,
  role,
}: {
  initials: string;
  logOutFn: () => unknown;
  role: "admin" | "superadmin";
}) {
  const { theme, setTheme } = useTheme();
  const { label, icon: ThemeIcon, next } = themeConfig[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          {role === "superadmin" && (
            <DropdownMenuItem>
              <Link
                to="/superadmin"
                className="inline-flex w-full justify-between items-center"
              >
                <span className="me-auto">Super Admin</span> <ShieldUserIcon />
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            <Link
              to="/settings"
              className="inline-flex w-full justify-between items-center"
            >
              <span className="me-auto">Ayarlar</span> <Settings2Icon />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer justify-between"
            onClick={() => setTheme(next)}
          >
            {label} <ThemeIcon />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={logOutFn}
            className="cursor-pointer justify-between"
            variant="destructive"
          >
            Çıkış Yap <LogOutIcon />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
