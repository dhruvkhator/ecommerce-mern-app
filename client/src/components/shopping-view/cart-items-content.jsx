import { Minus, Plus, Trash } from "lucide-react";
import { Button } from "../ui/button";
import { useDispatch } from "react-redux";
import { deleteCartItem, updateCartQuantity } from "@/store/shop/cart-slice";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

import axios from "axios";
import { PRODUCT_HOST } from "@/utils/constants";


const UserCartItemsContent = ({ cartItem }) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isValidProduct, setIsValidProduct] = useState(true);
  const [totalStock, setTotalStock] = useState(0);
  const [images, setImages] = useState([])

  useEffect(() => {
    const validateProduct = async () => {
      try {
        const res = await axios.post(`${PRODUCT_HOST}/product/validate`, { productId: cartItem.product });
        setIsValidProduct(res.data.validation);
      } catch (error) {
        console.log(error);
        setIsValidProduct(false);
      }
    }

    const getStock = async () => {

        try {
          const res = await axios.get(`${PRODUCT_HOST}/product/${cartItem.product}`);
          setTotalStock(res.data.product.stock);
          setImages(res.data.product.images)
        } catch (error) {
          console.log(error);
          setTotalStock(0);
        }
    }
    getStock();
    validateProduct();
  }, [cartItem?.product])
  
  const handleUpdateQuantity = (getCartItem, typeOfAction) => {
    if (typeOfAction == "plus") {

      if(cartItem.quantity >= totalStock){
        toast({
          title: `Stock Overflow`,
          description: `You can't add more than ${totalStock} items`,
          variant: "destructive",
        });
        return;
      }}

    dispatch(
      updateCartQuantity({
        productId: getCartItem?.product,
        quantity:
          typeOfAction === "plus"
            ? getCartItem?.quantity + 1
            : getCartItem?.quantity - 1,
      })
    ).then((data) => {
      if (data?.payload?.code === "SUCCESS") {
        toast({
          title: "Cart item is updated successfully",
        });
      }
    });
  }

  const handleCartItemDelete = (getCartItem) => {
    dispatch(
      deleteCartItem({ productId: getCartItem?.product })
    ).then((data) => {
      if (data?.payload?.code === "SUCCESS") {
        toast({
          title: "Cart item is deleted successfully",
        });
      } else {
        toast({
          title: "Failed to delete cart item",
          description: data.payload.message,
          variant: "destructive"
        })
      }
    });
  }
  
  return (
    <div className="flex items-center space-x-4">
      <img
        src={images[0]}
        alt={cartItem?.name}
        className="w-20 h-20 rounded object-cover"
      />
      <div className="flex-1">
        <h3 className={`font-extrabold ${!isValidProduct ? "line-through text-gray-400" : ""}`}>{cartItem?.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            className="h-8 w-8 rounded-full"
            size="icon"
            disabled={cartItem?.quantity === 1}
            onClick={() => handleUpdateQuantity(cartItem, "minus")}
          >
            <Minus className="w-4 h-4" />
            <span className="sr-only">Decrease</span>
          </Button>
          <span className="font-semibold">{cartItem?.quantity}</span>
          <Button
            variant="outline"
            className="h-8 w-8 rounded-full"
            size="icon"
            onClick={() => handleUpdateQuantity(cartItem, "plus")}
          >
            <Plus className="w-4 h-4" />
            <span className="sr-only">Decrease</span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <p className="font-semibold">
          $
          {(
            (cartItem?.salePrice > 0 ? cartItem?.salePrice : cartItem?.price) *
            cartItem?.quantity
          ).toFixed(2)}
        </p>
        <Trash
          onClick={() => handleCartItemDelete(cartItem)}
          className="cursor-pointer mt-1"
          size={20}
        />
      </div>
    </div>
  );
}

export default UserCartItemsContent;