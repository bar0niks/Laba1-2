import { configureStore } from "@reduxjs/toolkit";
import { dashboardApi } from "./apiSlice";

export const reduxStore = configureStore({
  reducer: {
    [dashboardApi.reducerPath]: dashboardApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(dashboardApi.middleware)
});

export type RootState = ReturnType<typeof reduxStore.getState>;
