import { Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider/hooks";

export default function Header() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <header className="flex w-screen items-center justify-between border-b p-4">
      {/* Left side header */}
      <h1 className="text-xl font-bold">Mesau</h1>

      {/* Right side header */}
      <div className="flex items-center gap-x-2">
        {/* Theme switch */}
        <Button
          className="transition-none"
          size="icon"
          variant="secondary"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {isDark ? (
            <Sun className="h-9 w-9" strokeWidth={3} />
          ) : (
            <Moon className="h-9 w-9" strokeWidth={3} />
          )}
        </Button>
        {/* User menu */}
        <div>x</div>
      </div>
    </header>
  );
}
