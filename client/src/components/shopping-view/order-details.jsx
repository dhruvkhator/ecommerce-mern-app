import { useSelector } from "react-redux";
import { Badge } from "../ui/badge";
import { DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

const ShoppingOrderDetailsView = ({ orderDetails }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg p-6">
      <div className="grid gap-6">
        {/* Order Summary */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-600">Order ID</p>
            <Label className="text-gray-800">{orderDetails?._id}</Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-600">Order Date</p>
            <Label className="text-gray-800">{orderDetails?.createdAt.split("T")[0]}</Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-600">Order Price</p>
            <Label className="text-gray-800">${orderDetails?.totalPrice}</Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-600">Payment Status</p>
            <Label className="text-gray-800">{orderDetails?.paymentStatus}</Label>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-600">Order Status</p>
            <Label>
              <Badge
                className={`py-1 px-3 rounded text-white ${orderDetails?.status === "Processed" ||
                    orderDetails?.status === "Shipped" ||
                    orderDetails?.status === "Delivered"
                    ? "bg-green-500"
                    : orderDetails?.status === "Expired" ||
                      orderDetails?.status === "Cancelled"
                      ? "bg-red-600"
                      : "bg-gray-600"
                  }`}
              >
                {orderDetails?.status}
              </Badge>
            </Label>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Order Details */}
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Order Details</h2>
          <ul className="grid gap-3">
            {orderDetails?.products && orderDetails?.products.length > 0
              ? orderDetails?.products.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between text-gray-600 overflow-x-auto"
                >
                  <span className="font-medium">Name:</span>
                  <span>{item.name}</span>
                  <span className="font-medium">Quantity:</span>
                  <span>{item.quantity}</span>
                  <span className="font-medium">Price:</span>
                  <span>${item.price}</span>
                </li>
              ))
              : <li className="text-gray-500">No products found.</li>}
          </ul>
        </div>

        <Separator className="my-4" />

        {/* Shipping Info */}
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Shipping Info</h2>
          <div className="bg-gray-50 p-4 rounded-md shadow-sm grid gap-2">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">Name:</span>
              <span className="text-gray-800">{user.name}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">Address:</span>
              <span className="text-gray-800">{orderDetails?.shippingAddress?.street}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">City:</span>
              <span className="text-gray-800">{orderDetails?.shippingAddress?.city}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">State:</span>
              <span className="text-gray-800">{orderDetails?.shippingAddress?.state}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">Pincode:</span>
              <span className="text-gray-800">{orderDetails?.shippingAddress?.pincode}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-24">Phone:</span>
              <span className="text-gray-800">{orderDetails?.phone}</span>
            </div>
          </div>

        </div>
      </div>
    </DialogContent>

  );
}

export default ShoppingOrderDetailsView;