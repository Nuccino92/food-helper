import { RouterProvider, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "./context/ThemeProvider";
import { PersonaProvider } from "./context/PersonaProvider";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <ThemeProvider storageKey="vite-ui-theme">
      <PersonaProvider>
        <RouterProvider router={router} />
      </PersonaProvider>
    </ThemeProvider>
  );
}
