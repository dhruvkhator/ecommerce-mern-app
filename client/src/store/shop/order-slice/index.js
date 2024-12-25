import {  ORDER_HOST, PAYMENT_HOST } from "@/utils/constants";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  approvalURL: null,
  isLoading: false,
  orderId: null,
  orderList: [],
  orderDetails: null,
};

export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",
  async (orderData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${ORDER_HOST}`, 
        {orderData}, { headers: { Authorization: `Bearer ${token}` }}
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

export const createPayment = createAsyncThunk(
  "/payment/createPayment",
  async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${PAYMENT_HOST}`, 
        {data}, { headers: { Authorization: `Bearer ${token}` }}
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

export const capturePayment = createAsyncThunk(
  "/payment/capturePayment",
  async ({ paymentId, payerId, status }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${PAYMENT_HOST}/${paymentId}/status`, 
        {
          status,
          payerId,
        }, {headers: { Authorization: `Bearer ${token}` }}
      );
  
  
      return response.data;
    } catch (error) {
      console.log(error);
      if(error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }
  }
);

export const cancelPayment = createAsyncThunk(
  "/payment/cancelPayment", 
  async({orderId}) => {
    //console.log(orderId)
    try {

      const response = await axios.patch(`${PAYMENT_HOST}/${orderId}/cancel`);

      //console.log(response)
      return response.data;
      
    } catch (error) {
      console.log(error)
      return error.response.data;
    }
  }
)

export const getAllOrdersByUserId = createAsyncThunk(
  "/order/getAllOrdersByUserId",
  async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${ORDER_HOST}`, {headers: { Authorization: `Bearer ${token}` }}
      );
      //console.log(response.data)
      return response.data;
    } catch (error) {
      console.log(error)
      return error.response.data;
    }
  }
);

export const getOrderDetails = createAsyncThunk(
  "/order/getOrderDetails",
  async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${ORDER_HOST}/${id}/details`, {headers: { Authorization: `Bearer ${token}` } }
      );
      
      //console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error)
      return error.response.data;
    }
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNewOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.approvalURL = action.payload.approvalURL;
        state.orderId = action.payload.order._id;
        sessionStorage.setItem(
          "currentOrderId",
          JSON.stringify(action.payload.order._id)
        );
        state.orderDetails = action.payload.order;
      })
      .addCase(createNewOrder.rejected, (state) => {
        state.isLoading = false;
        state.approvalURL = null;
        state.orderId = null;
        state.orderDetails = null;
      })
      .addCase(createPayment.pending, (state)=>{
        state.isLoading = true;
      })
      .addCase(createPayment.fulfilled, (state, action)=>{
        state.isLoading = false;
        state.approvalURL = action.payload.approvalURL;
      })
      .addCase(createPayment.rejected, (state)=>{
        state.isLoading = false;
        state.approvalURL = null;
      })
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.orders;
      })
      .addCase(getAllOrdersByUserId.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.order;
      })
      .addCase(getOrderDetails.rejected, (state) => {
        state.isLoading = false;
        state.orderDetails = null;
      });
  },
});

export const { resetOrderDetails } = shoppingOrderSlice.actions;

export default shoppingOrderSlice.reducer;