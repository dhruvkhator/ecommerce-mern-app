import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "@/hooks/use-toast";
import { setProductDetails } from "@/store/shop/products-slice";
import { Label } from "../ui/label";
import StarRatingComponent from "../common/star-rating";
import { useEffect, useState } from "react";
import { addReview, getReviews } from "@/store/shop/review-slice";
import { checkAuth } from "@/store/auth-slice";

const ProductDetailsDialog = ({ open, setOpen, productDetails }) => {
  const [reviewMsg, setReviewMsg] = useState("");
  const [rating, setRating] = useState(0);
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { reviews } = useSelector((state) => state.shopReview);

  const [quantity, setQuantity] = useState(1);
  const [productQuantity, setProductQuantity] = useState(0);

  const { toast } = useToast();

  useEffect(()=>{
    dispatch(fetchCartItems());
  },[dispatch])

  useEffect(() => {
    if(!isAuthenticated) dispatch(checkAuth());
  })


  const handleQuantityChange = (value) => {
    if (value > 0 && value <= productDetails.stock) {
      setQuantity(value);
    }
  };

  const handleRatingChange = (getRating) => {
  
    setRating(getRating);
  }

  const handleAddToCart = async () => {
  
    dispatch(addToCart({  productId: productDetails._id, quantity })).then(data=>{
      if(data.payload.code ==="SUCCESS"){
        toast({
          title: "Added to Cart",
          description: `${quantity} x ${productDetails.name} ${data?.payload?.message}`,
        });
      }
      else{
        
        toast({
          title: "Error Adding to cart",
          description: data?.payload?.message,
          variant: "destructive"
        })
      }
    })
  };
  const handleDialogClose = () => {
    setOpen(false);
    dispatch(setProductDetails());
    setRating(0);
    setReviewMsg("");
  }

  const handleAddReview = () => {
    dispatch(
      addReview({
        productId: productDetails?._id,
        reviewText: reviewMsg,
        rating,
        name: user?.name
      })
    ).then((data) => {
      if (data.payload.code==="SUCCESS") {
        setRating(0);
        setReviewMsg("");
        dispatch(getReviews(productDetails?._id));
        toast({
          title: "Review added successfully!",
        });
      }
    });
  }

  useEffect(() => {
    if (cartItems?.products) {
      const product = cartItems.products.find(
        (item) => item.product === productDetails?._id
      );
      if (product) {
        setProductQuantity(product.quantity);
      }
    }
  }, [cartItems, productDetails?._id, setProductQuantity]);
  

  useEffect(() => {
    if (productDetails !== null) {
      dispatch(getReviews(productDetails?._id));

    };
  }, [productDetails]);


  const averageReview =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, reviewItem) => sum + reviewItem.rating, 0) /
      reviews.length
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="grid grid-cols-2 gap-8 sm:p-12 max-w-[90vw] sm:max-w-[80vw] lg:max-w-[70vw] max-h-[90vh] overflow-hidden rounded-lg">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={productDetails?.images[0]}
            alt={productDetails?.title}
            width={600}
            height={600}
            className="aspect-square w-full object-cover"
          />

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              <StarRatingComponent rating={averageReview} />
            </div>
            <span className="text-muted-foreground">
              ({averageReview.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[85vh]">
          <div>
            <DialogTitle className="text-3xl font-extrabold">{productDetails?.name}</DialogTitle>
            <p className="text-muted-foreground text-2xl mb-5 mt-4">
              {productDetails?.description}
            </p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2">Specifications</h2>
            <ul className="list-disc list-inside text-gray-700">
              {productDetails?.specifications.map((spec) => (
                <li key={spec._id}>
                  <strong>{spec.key}:</strong> {spec.value}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between">
            <p
              className={`text-3xl font-bold text-primary ${productDetails?.salePrice > 0 ? "line-through" : ""
                }`}
            >
              ${productDetails?.price}
            </p>
            {productDetails?.salePrice > 0 ? (
              <p className="text-2xl font-bold text-muted-foreground">
                ${productDetails?.salePrice}
              </p>
            ) : null}
          </div>


          <div className="mt-5 mb-5">
            {productDetails?.stock === 0 ? (
              <Button className="w-full opacity-60 cursor-not-allowed">
                Out of Stock
              </Button>
            ) : (
              <>
                <div className="quantity-selector flex items-center gap-2 my-4">
                  <Button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
                    className="quantity-input w-16 text-center font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={productQuantity+quantity >= productDetails?.stock}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    +
                  </Button>
                </div>



                <Button
                  className="w-full"
                  onClick={() =>handleAddToCart()}>
                  Add to Cart
                </Button>
              </>
            )}
          </div>
          <Separator />
          <div className="mx-h-[40vh] overflow-y-auto py-4">
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            <div className="grid gap-6">
              {reviews && reviews.length > 0 ? (
                reviews.map((reviewItem) => (
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10 border">
                      <AvatarFallback>
                        {reviewItem?.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{reviewItem?.name}</h3>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <StarRatingComponent rating={reviewItem?.rating} />
                      </div>
                      <p className="text-muted-foreground">
                        {reviewItem.reviewText}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <h1>No Reviews</h1>
              )}
            </div>
            <div className="mt-10 flex-col flex gap-2">
              <Label>Write a review</Label>
              <div className="flex gap-1">
                <StarRatingComponent
                  rating={rating}
                  handleRatingChange={handleRatingChange}
                />
              </div>
              <Input
                name="reviewMsg"
                value={reviewMsg}
                onChange={(event) => setReviewMsg(event.target.value)}
                placeholder="Write a review..."
              />
              <Button
                onClick={handleAddReview}
                disabled={reviewMsg.trim() === ""}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDetailsDialog;