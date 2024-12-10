import { PRODUCT_HOST } from "@/utils/constants";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  productList: [],
  filterList: null,
  productDetails: null,
  featuredProducts:[]
};

export const fetchAllFilteredProducts = createAsyncThunk(
  "/products/fetchAllFilteredProducts",
  async ({ filters, keyword }, { rejectWithValue }) => {
    try {

      const {minPrice, maxPrice, sort, ...dynamicFilters} = filters;
      // Build query parameters dynamically
      const params = {
        ...(sort && { sort }),
        ...(keyword && { keyword }), // Add keyword only if it exists
        ...(minPrice && { minPrice }), // Add minPrice only if it exists
        ...(maxPrice && { maxPrice }), // Add maxPrice only if it exists
        filters: JSON.stringify(dynamicFilters), // Send remaining filters as a JSON string under `filters`
      };

      const response = await axios.get(`${PRODUCT_HOST}/product/filter`, {
        params, // Pass the query parameters
      });

      return response.data; // Returns { products: [...] }
    } catch (error) {
      console.error("Error fetching filtered products:", error);
      return rejectWithValue(error.response?.data || "Failed to fetch filtered products");
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  "/products/fetchAllProducts",

  async (keyword) => {
    try { 

      const res = await axios.get(`${PRODUCT_HOST}/product/search`, { params: {q:keyword}});
      return res.data;

    } catch (error) {
      console.log(error);
      return error.response?.data;
    }
  }
)

export const fetchProductsOnBrandOrCategory = createAsyncThunk("/products/fetchProductsOnBrandOrCategory",
  async({ section, id }, { rejectWithValue }) =>{
    try {
      //console.log(`${id}`)
      const result = await axios.get(`${PRODUCT_HOST}/product/${section}/${id}`);
      //console.log(result);
      return result.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  }
)

export const fetchProductDetails = createAsyncThunk(
  "/products/fetchProductDetails",
  async (id) => {
    try {
      const result = await axios.get(
        `${PRODUCT_HOST}/product/${id}`
      );
      //console.log(result.data.product)
      return result?.data;
    } catch (error) {
      console.log(error);
      return error.response?.data;
    }
    
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  "/products/fetchFeatuuredProducts",
  async () => {
    try {
      const result = await axios.get(
        `${PRODUCT_HOST}/product/feature`
      );
      //console.log(result.data.product)
      return result?.data;
    } catch (error) {
      console.log(error);
      return error.response?.data;
    }
    
  }
);


const shoppingProductSlice = createSlice({
  name: "shoppingProducts",
  initialState,
  reducers: {
    setProductDetails: (state) => {
      state.productDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllFilteredProducts.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(fetchAllFilteredProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.products;
      })
      .addCase(fetchAllFilteredProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.productList = [];
      })
      .addCase(fetchAllProducts.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.products;
        state.filterList = action.payload.filters;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.productList = [];
        state.filterList = null;
      })
      .addCase(fetchProductDetails.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productDetails = action.payload.product;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.productDetails = null;
      })
      .addCase(fetchProductsOnBrandOrCategory.pending, (state, action)=>{
        state.isLoading = true;
      })
      .addCase(fetchProductsOnBrandOrCategory.fulfilled, (state, action)=>{
        state.isLoading = false;
        state.productList = action.payload.products;
      })
      .addCase(fetchProductsOnBrandOrCategory.rejected, (state, action)=>{
        state.isLoading = false;
        state.productList = null;
      })
      .addCase(fetchFeaturedProducts.pending, (state)=>{
        state.isLoading = true;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action)=>{
        state.isLoading = false;
        state.featuredProducts = action.payload.featuredProducts;
      })
      .addCase(fetchFeaturedProducts.rejected, (state)=>{
        state.isLoading = false;
        state.featuredProducts = [];
      })
  },
});

export const { setProductDetails } = shoppingProductSlice.actions;

export default shoppingProductSlice.reducer;