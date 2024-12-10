import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import brandSlice from "./shop/brand-slice";
import categorySlice from './shop/category-slice';
import shopProductsSlice from "./shop/products-slice";
import shopCartSlice from "./shop/cart-slice";
import shopAddressSlice from "./shop/address-slice";
import shopOrderSlice from "./shop/order-slice";
import shopReviewSlice from "./shop/review-slice";


const store = configureStore({
  reducer: {
    auth: authReducer,    
    shopBrands: brandSlice,
    shopCategories: categorySlice,
    shopProducts: shopProductsSlice,
    shopCart: shopCartSlice,
    shopAddress: shopAddressSlice,
    shopOrder: shopOrderSlice,
    shopReview: shopReviewSlice,
  },
});

export default store;