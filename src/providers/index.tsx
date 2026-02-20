import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as StoreProvider } from "jotai";
import { ThemeProvider } from "@/components/ThemeProvider";
import { store } from "@/state/store";
import type { Router } from "../main";

export default function Providers({
  router,
  queryClient,
}: {
  router: Router;
  queryClient: QueryClient;
}) {
  return (
    <StoreProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </StoreProvider>
  );
}
