import { AUTH_HOST, USER_HOST } from "@/utils/constants";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setItemWithExpiration, getItemWithExpiration } from "@/utils/storageUtils";
import axios from "axios";

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

export const registerUser = createAsyncThunk(
  "/auth/register",

  async (formData) => {
    console.log(AUTH_HOST)
    try {
      const response = await axios.post(
        `${AUTH_HOST}/signup`,
        formData,
      );
      //console.log(response.data);

      return response.data;
    } catch (error) {
      console.log(error);
      if (error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }
  }
);

export const loginUser = createAsyncThunk(
  "/auth/login",
  async (formData) => {

    try {
      const response = await axios.post(
        `${AUTH_HOST}/signin`,
        formData,
      );
      const { token } = response.data;

      // Store token in localStorage with a 1-day expiration
      setItemWithExpiration('token', token, 24 * 60 * 60 * 1000);

      return response.data;
    } catch (error) {
      console.log(error);
      if (error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }

  }
);

//not really of any use
export const logoutUser = createAsyncThunk(
  "/auth/logout",

  async () => {
    try {
      const response = await axios.post(
        `${AUTH_HOST}/logout`,
      );

      return response.data;
    } catch (error) {
      console.log(error);
      return error.response?.data;
    }

  }
);

export const checkAuth = createAsyncThunk(
  "/auth/checkauth",
  async (_, { rejectWithValue }) => {
    try {
      const token = getItemWithExpiration('token');
      if (!token) {
        // If the token is missing or expired, reject immediately
        return rejectWithValue({ message: 'Token is missing or expired' });
      }

      // Proceed to validate the token with the backend
      const response = await axios.get(`${USER_HOST}/check-auth`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error during backend auth check:', error);
      return rejectWithValue(error?.response?.data || { message: 'Authentication check failed' });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => { },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {

        state.isLoading = false;
        state.user = action.payload.code === "SUCCESS" ? action.payload.user : null;
        state.isAuthenticated = action.payload.code === "SUCCESS";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.code === 'SUCCESS' ? action.payload.user : null;
        state.isAuthenticated = action.payload.code === 'SUCCESS';
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;