import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { PRODUCT_HOST } from "@/utils/constants";

const initialState = {
    isLoading: false,
    categories: [],
    error: null,
};

export const fetchTopCategories = createAsyncThunk('categorys/fetchTopCategories', async () => {
    const response = await axios.get(`${PRODUCT_HOST}/category/top`);
    //console.log(response)
    return response.data.categories;
})

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTopCategories.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchTopCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload;
            })
            .addCase(fetchTopCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message;
            });
    }
})

export default categorySlice.reducer;
