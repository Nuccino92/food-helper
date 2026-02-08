import * as React from "react";
import { Outlet, Link, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <span className="text-7xl">🍳</span>
      <h1 className="mt-6 text-3xl font-bold uppercase tracking-wide">
        Not on the Menu
      </h1>
      <p className="mt-3 max-w-md text-lg text-muted-foreground leading-relaxed">
        We couldn't find that page. Maybe it wandered off looking for
        something to eat.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to Miso
      </Link>
    </div>
  );
}
