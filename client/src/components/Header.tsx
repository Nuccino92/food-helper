import { Settings, Sun, Moon, FileText, Shield, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/context/ThemeProvider/hooks";
import { PERSONAS, PersonaSelector } from "./PersonaSelector";
import { usePersona } from "@/context/PersonaProvider/hooks";
import type { Persona } from "@/context/PersonaProvider/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { persona, setPersona } = usePersona();

  const selectedPersona =
    PERSONAS.find((p) => p.value === persona) ?? PERSONAS[0];

  const isDark = theme === "dark";

  function handlePersonaChange(selectedPersona: Persona) {
    setPersona(selectedPersona);
  }

  return (
    <header className={cn("dark:bg-muted flex h-(--header-height) w-full items-center justify-between border-b bg-white p-4", className)}>
      {/* Left side header */}
      <Button
        variant="ghost"
        className="h-auto p-0 hover:bg-transparent"
        onClick={() => window.location.reload()}
        aria-label="Reload application"
      >
        <div className="text-left">
          <h1 className="text-xl font-bold leading-tight">Miso</h1>
          <p className="text-muted-foreground text-xs font-normal">Can't decide what to eat?</p>
        </div>
      </Button>

      {/* Right side header */}
      <div className="flex items-center gap-x-2">
        <PersonaSelector
          selectedPersona={selectedPersona}
          onPersonaChange={handlePersonaChange}
        />

        {/* Settings menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {/* Theme selector row */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm">Theme</span>
              <div className="flex items-center rounded-lg bg-muted p-1">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "rounded-md p-1.5 transition-colors",
                    theme === "light"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  )}
                  aria-label="Light mode"
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "rounded-md p-1.5 transition-colors",
                    theme === "dark"
                      ? "bg-background shadow-sm"
                      : "hover:bg-background/50"
                  )}
                  aria-label="Dark mode"
                >
                  <Moon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/about">
                <Info className="mr-2 h-4 w-4" />
                How It Works
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/terms">
                <FileText className="mr-2 h-4 w-4" />
                Terms of Service
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/privacy">
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
