import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const PaymentFailurePage =()=> {
  const navigate = useNavigate();

  return (
    <Card className="p-10">
      <CardHeader className="p-0">
        <CardTitle className="text-4xl">Payment cancelled or failed!</CardTitle>
      </CardHeader>
      <Button className="mt-5" onClick={() => navigate("/shop/checkout")}>
        Continue with checkout?
      </Button>
    </Card>
  );
}

export default PaymentFailurePage;