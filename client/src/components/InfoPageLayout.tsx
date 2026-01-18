import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const INFO_PAGES = [
  { path: "/about", label: "How It Works" },
  { path: "/terms", label: "Terms of Service" },
  { path: "/privacy", label: "Privacy Policy" },
] as const;

interface InfoPageLayoutProps {
  children: React.ReactNode;
}

export function InfoPageLayout({ children }: InfoPageLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with navigation */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Miso
          </Link>
          <nav className="flex items-center gap-6">
            {INFO_PAGES.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className={cn(
                  "text-sm transition-colors hover:text-foreground",
                  location.pathname === page.path
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content - flex-1 ensures consistent height */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        {children}
      </main>
    </div>
  );
}
