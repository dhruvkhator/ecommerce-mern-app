import { PRODUCT_HOST } from "@/utils/constants";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    isLoading: false,
    brands: [],
    error: null,
};

export const fetchTopBrands = createAsyncThunk('brands/fetchTopBrands', async () => {
    const response = await axios.get(`${PRODUCT_HOST}/brand/top`);
    //console.log(response)
    return response.data.brands;
})

const brandSlice = createSlice({
    name: 'brands',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTopBrands.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchTopBrands.fulfilled, (state, action) => {
                state.isLoading = false;
                state.brands = action.payload;
            })
            .addCase(fetchTopBrands.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message;
            });
    }
})

export default brandSlice.reducer;
