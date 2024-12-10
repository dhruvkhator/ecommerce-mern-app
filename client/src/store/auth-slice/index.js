import { AUTH_HOST, ORDER_HOST, USER_HOST } from "@/utils/constants";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
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
        {
          withCredentials: true,
        }
      );
      //console.log(response.data);
  
      return response.data;
    } catch (error) {
      console.log(error);
      if(error.response?.status === 400) return error.response.data.errors[0];
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
        {
          withCredentials: true,
        }
      );
      //console.log(response);
  
      return response.data;
    } catch (error) {
      console.log(error);
      if(error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }
   
  }
);

export const logoutUser = createAsyncThunk(
  "/auth/logout",

  async () => {
    try {
      const response = await axios.post(
        `${AUTH_HOST}/logout`,
        {
          withCredentials: true,
        }
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

  async () => {
    try {
      const response = await axios.get(
        `${USER_HOST}/check-auth`,
        {
          withCredentials: true,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.log(error);
      return error?.response?.data;
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {},
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
        state.user = action.payload.code==="SUCCESS" ? action.payload.user : null;
        state.isAuthenticated = action.payload.code==="SUCCESS";
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
        state.user = action.payload.code==='SUCCESS' ? action.payload.user : null;
        state.isAuthenticated = action.payload.code==='SUCCESS';
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