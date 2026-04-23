import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserDto } from "@gym/shared-types";

interface AuthState {
  token: string | null;
  user: UserDto | null;
}

const storedUser = localStorage.getItem("user");

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  user: storedUser ? (JSON.parse(storedUser) as UserDto) : null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: UserDto }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    setCurrentUser: (state, action: PayloadAction<UserDto>) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
});

export const { logout, setCredentials, setCurrentUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
