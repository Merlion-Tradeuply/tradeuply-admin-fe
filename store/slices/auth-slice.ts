import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { InternalUser } from "@/lib/api/types";
import {
  loginAdmin,
  logoutAdmin,
  type LoginCredentials,
} from "@/services/auth-service";

type AuthState = {
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: InternalUser | null;
};

const initialState: AuthState = {
  error: null,
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await loginAdmin(credentials);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    }
  },
);

export const signOut = createAsyncThunk("auth/signOut", async () => {
  try {
    await logoutAdmin();
  } catch {
    // Clear local authentication state even if the server is unavailable.
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setAuthenticatedUser(state, action: PayloadAction<InternalUser>) {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(signIn.pending, (state) => {
        state.error = null;
        state.isLoading = true;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Unable to sign in.";
        state.isAuthenticated = false;
        state.isLoading = false;
        state.user = null;
      })
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.error = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.user = null;
      })
      .addCase(signOut.rejected, (state) => {
        state.isAuthenticated = false;
        state.isLoading = false;
        state.user = null;
      });
  },
});

export const { clearAuthError, setAuthenticatedUser } = authSlice.actions;
export default authSlice.reducer;
