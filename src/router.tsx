import { QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isAndroidBuild } from "@/lib/android-build";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Revisit pages render instantly from cache; refresh happens in background.
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const getRouter = () => {
  // Web build: no history passed — TanStack Start picks browser history on
  // the client and a server-appropriate history during SSR/prerender
  // (passing createBrowserHistory() explicitly breaks the Node prerender).
  //
  // Android full-offline build: the WebView loads from packaged assets via
  // WebViewAssetLoader with no server to rewrite deep pathnames to
  // index.html, so that build runs hash history.
  const router = createRouter({
    routeTree,
    context: { queryClient },
    ...(isAndroidBuild ? { history: createHashHistory() } : {}),
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Prefetch a route's code + data as soon as a link is intented (touch,
    // hover, focus) so taps feel instant on slow mobile networks.
    defaultPreload: "intent",
  });

  return router;
};
