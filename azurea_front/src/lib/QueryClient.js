import { QueryCache, QueryClient } from "@tanstack/react-query";
import { apiMessage } from "./Normalize";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      window.dispatchEvent(
        new CustomEvent("auberge-toast", {
          detail: apiMessage(error),
        }),
      );
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});