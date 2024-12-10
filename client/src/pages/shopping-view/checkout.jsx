import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder, createPayment } from "@/store/shop/order-slice";

import { useToast } from "@/hooks/use-toast";

const ShoppingCheckout = () => {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymemntStart] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();


  const totalCartAmount =
    cartItems && cartItems.products && cartItems.products.length > 0
      ? cartItems.products.reduce(
        (sum, currentItem) =>
          sum +
          (currentItem?.salePrice > 0
            ? currentItem?.salePrice
            : currentItem?.price) *
          currentItem?.quantity,
        0
      )
      : 0;

  const handleInitiatePaypalPayment = () => {
    if (cartItems?.products.length === 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed",
        variant: "destructive",
      });

      return;
    }
    if (currentSelectedAddress === null) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });

      return;
    }

    const orderData = {
      user: user?._id,
      products: cartItems?.products.map((singleCartItem) => ({
        product: singleCartItem?.product,
        name: singleCartItem?.name,
        price: singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      shippingAddress: {
        addressId: currentSelectedAddress?._id,
        street: currentSelectedAddress?.street,
        city: currentSelectedAddress?.city,
        state: currentSelectedAddress?.state,
        pincode: currentSelectedAddress?.pincode,
      },
      phone: currentSelectedAddress?.phone,
    };

    dispatch(createNewOrder(orderData)).then((data) => {

      if (data?.payload?.code === "SUCCESS") {

        const orderId = data.payload.order._id;
        // Access the orderId
        setIsPaymemntStart(true);
        toast({
          title: data.payload.message
        })
        
        dispatch(createPayment({ orderId, amount:totalCartAmount }))
        .then((paymentResponse) => {
          console.log(paymentResponse)
          sessionStorage.setItem("currentOrderId", JSON.stringify(orderId));
            if (paymentResponse?.payload?.approval_url) {
              // Redirect to PayPal approval URL
              window.location.href = paymentResponse.payload.approval_url;
            } else {
              toast({
                title: "Payment initiation failed.",
                variant: "destructive",
              });
            }
          })

      } else {
        console.log("here")
        toast({
          title: data?.payload?.error,
          variant: "destructive",
        })
        setIsPaymemntStart(false);
      }
    });
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.products && cartItems.products.length > 0
            ? cartItems.products.map((item) => (
              <UserCartItemsContent cartItem={item} />
            ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">${totalCartAmount}</span>
            </div>
          </div>
          <div className="mt-4 w-full">
            <Button onClick={handleInitiatePaypalPayment} className="w-full">
            {isPaymentStart
                ? "Processing Paypal Payment..."
                : "Checkout with Paypal"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;