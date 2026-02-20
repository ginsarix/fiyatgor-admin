import "./index.css";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import Providers from "./providers";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  context: {
    queryClient,
  },
});

export type Router = typeof router;

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Providers router={router} queryClient={queryClient} />);
}
