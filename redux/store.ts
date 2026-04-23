import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./authSlice";
import { gymApi } from "./apiSlice";

export const reduxStore = configureStore({
  reducer: {
    auth: authReducer,
    [gymApi.reducerPath]: gymApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(gymApi.middleware)
});

export type RootState = ReturnType<typeof reduxStore.getState>;
export type AppDispatch = typeof reduxStore.dispatch;
