import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { CART_HOST } from "@/utils/constants";

const initialState = {
  cartItems: [],
  isLoading: false,
};

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity }) => {
    try {
      const token = localStorage.getItem('token');
      console.log(token);
      const response = await axios.post(
        `${CART_HOST}`,
        {
          productId,
          quantity,
        },{headers: { Authorization: `Bearer ${token}` }}
      );
      //console.log(response)
      return response.data;
    } catch (error) {
      console.log(error);
      if(error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }
    
  }
);

export const fetchCartItems = createAsyncThunk(
  "cart/fetchCartItems",
  async () => {
    try {
      const token = localStorage.getItem('token');
      console.log(token)
      const response = await axios.get(
        `${CART_HOST}`, {headers: { Authorization: `Bearer ${token}` }}
      );
      //console.log(response.data)
      return response.data;
    } catch (error) {
      return error?.reponse?.data
    }
    
  }
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async ({  productId }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${CART_HOST}/${productId}`, {headers: { Authorization: `Bearer ${token}` }}
      );
  
      return response.data;
    } catch (error) {
      return error.response.data;
    }
    
  }
);

export const updateCartQuantity = createAsyncThunk(
  "cart/updateCartQuantity",
  async ({ productId, quantity }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${CART_HOST}/${productId}`,
        {
          quantity,
        }, { headers: { Authorization: `Bearer ${token}` }}
      );
      //console.log(response.data)
      return response.data;
    } catch (error) {
      console.log(error);
      if(error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }
    
  }
);

const shoppingCartSlice = createSlice({
  name: "shoppingCart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.data;
      })
      .addCase(addToCart.rejected, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      })
      .addCase(fetchCartItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.cart;
      })
      .addCase(fetchCartItems.rejected, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      })
      .addCase(updateCartQuantity.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.cart;
      })
      .addCase(updateCartQuantity.rejected, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      })
      .addCase(deleteCartItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartItems = action.payload.cart;
      })
      .addCase(deleteCartItem.rejected, (state) => {
        state.isLoading = false;
        state.cartItems = [];
      });
  },
});

export default shoppingCartSlice.reducer;