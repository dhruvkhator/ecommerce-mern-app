import { REVIEW_HOST } from "@/utils/constants";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getItemWithExpiration } from "@/utils/storageUtils";

const initialState = {
  isLoading: false,
  reviews: [],
};

export const addReview = createAsyncThunk(
  "/order/addReview",
  async (formdata) => {
    try {
      const token = getItemWithExpiration('token');
      const response = await axios.post(
        `${REVIEW_HOST}`,
        formdata, { headers: { Authorization: `Bearer ${token}` }}
      );
  
      return response.data;
    } catch (error) {
      console.log(error);
      if(error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }
  }
);

export const getReviews = createAsyncThunk("/order/getReviews", async (id) => {
  try {

    const response = await axios.get(
      `${REVIEW_HOST}/${id}`
    );
  
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response.data;
  }
});

const reviewSlice = createSlice({
  name: "reviewSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getReviews.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.reviews;
      })
      .addCase(getReviews.rejected, (state) => {
        state.isLoading = false;
        state.reviews = [];
      });
  },
});

export default reviewSlice.reducer;