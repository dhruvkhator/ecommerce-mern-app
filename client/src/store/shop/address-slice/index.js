import { USER_HOST } from "@/utils/constants";
import { getItemWithExpiration } from "@/utils/storageUtils";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  addressList: [],
};

export const addNewAddress = createAsyncThunk(
  "/addresses/addNewAddress",
  async (formData) => {

    try {
      const token = getItemWithExpiration('token');
      const response = await axios.post(
        `${USER_HOST}/address`,
        {addressData: formData}, { headers: { Authorization: `Bearer ${token}` }}
      );


      return response.data;
      
    } catch (error) {
      console.log(error);
      if(error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }
  }
);

export const fetchAllAddresses = createAsyncThunk(
  "/addresses/fetchAllAddresses",
  async () => {
    try {
      const token = getItemWithExpiration('token');
      const response = await axios.get(
        `${USER_HOST}/address`, { headers: { Authorization: `Bearer ${token}` }}
      );

      return response.data;
      
    } catch (error) {
      console.log(error?.response)
      return error?.response?.data;
    }
  }
);

export const editaAddress = createAsyncThunk(
  "/addresses/editaAddress",
  async ({  addressId, formData }) => {
    try {
      const token = getItemWithExpiration('token');
      const response = await axios.patch(
        `${USER_HOST}/address/${addressId}`,
        {addressData: formData}, { headers: { Authorization: `Bearer ${token}` }}
      );

      return response.data;
    } catch (error) {
      console.log(error);
      if(error.response?.status === 400) return error.response.data.errors[0];
      return error?.response?.data;
    }
  }
);

export const deleteAddress = createAsyncThunk(
  "/addresses/deleteAddress",
  async ({  addressId }) => {
    try {
      const token = getItemWithExpiration('token');
      const response = await axios.delete(
        `${USER_HOST}/address/${addressId}`, {headers: { Authorization: `Bearer ${token}` }}
      );
  
      return response.data;
    } catch (error) {
      console.log(error);
      return error?.response?.data;
    }
    
  }
);

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addNewAddress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addNewAddress.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(addNewAddress.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchAllAddresses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addressList = action.payload.address;
      })
      .addCase(fetchAllAddresses.rejected, (state) => {
        state.isLoading = false;
        state.addressList = [];
      });
  },
});

export default addressSlice.reducer;