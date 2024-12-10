import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelPayment } from "@/store/shop/order-slice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PaypalCancelPage = ()=> {
  const dispatch = useDispatch();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const paymentId = params.get("paymentId");
  const {toast} = useToast();


  const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

  useEffect(() => {
    if (orderId) {
      dispatch(cancelPayment({ orderId })).then((data) => {
        if (data?.payload?.code === "SUCCESS") {
            sessionStorage.removeItem("currentOrderId");
            toast({
                title: data.payload.message
            })
          window.location.href = "/shop/payment-failure";
        }
      });
    }
  }, [paymentId, dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cancelling Payment...Please wait!</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default PaypalCancelPage;