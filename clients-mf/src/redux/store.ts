import { configureStore } from "@reduxjs/toolkit";
import { clientsApi } from "./apiSlice";

export const reduxStore = configureStore({
  reducer: {
    [clientsApi.reducerPath]: clientsApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(clientsApi.middleware)
});

export type RootState = ReturnType<typeof reduxStore.getState>;
