import { Button } from "@/components/ui/button";

import { ChevronLeftIcon, ChevronRightIcon} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeaturedProducts, fetchProductDetails } from "@/store/shop/products-slice";
import { fetchTopBrands } from "@/store/shop/brand-slice";
import { fetchTopCategories } from '@/store/shop/category-slice';
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useNavigate } from "react-router-dom";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "@/hooks/use-toast";
import ProductDetailsDialog from "@/components/shopping-view/product-details";



const ShoppingHome = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featureImageList, setFeatureImageList] = useState([]);
  const {  productDetails, featuredProducts } = useSelector(
    (state) => state.shopProducts
  );
  const {  brands } = useSelector((state) => state.shopBrands);
  const {  categories  } = useSelector((state) => state.shopCategories);

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();


  const handleNavigateToListingPage = (getCurrentItem, section) => {
    // Directly navigate with query parameters
    navigate(`/shop/listing?${section}=${getCurrentItem._id}`);
  };
  //console.log(dispatch(fetchTopBrands()));

  const handleGetProductDetails = (getCurrentProductId) => {
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  const handleAddtoCart = (getCurrentProductId) => {
    dispatch(
      addToCart({
        productId: getCurrentProductId,
        quantity: 1,
      })
    ).then((data) => {
      if (data?.payload?.code==="SUCCESS") {
        dispatch(fetchCartItems(user?._id));
        toast({
          title: "Product is added to cart",
        });
      }else{

      }
    });
  }

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    
  },[dispatch])

  useEffect(() => {
    if (featuredProducts.length > 0) {
      const imageList = featuredProducts.map((product) => product.featuredImages[0]);
      if (JSON.stringify(imageList) !== JSON.stringify(featureImageList)) {
        setFeatureImageList(imageList);
      }
    }
  }, [featuredProducts]);
  

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  

  useEffect(() => {
    if (featureImageList.length > 0) {

      const timer = setInterval(() => {
        setCurrentSlide((prevSlide) => {
          
          return (prevSlide + 1) % featureImageList.length;
        });
      }, 5000);
  
      return () => {
        
        clearInterval(timer);
      };
    }
  }, [featureImageList]);
  

  

  useEffect(() => {
    dispatch(fetchTopBrands());
    dispatch(fetchTopCategories());
  }, [dispatch]);



  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative w-full h-[600px] overflow-hidden">
        {featureImageList && featureImageList.length > 0
          ? featureImageList.map((image, index) => (
            <img
              src={image}
              key={index}
              className={`${index === currentSlide ? "opacity-100" : "opacity-0"
                } absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000`}
            />
          ))
          : null}
        <Button
          variant="outline"
          size="icon"
          onClick={(e) =>{
            setCurrentSlide(
              (prevSlide) =>
                (prevSlide - 1 + featureImageList.length) %
                featureImageList.length)
          }}
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/80"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            setCurrentSlide((prevSlide) =>
              (prevSlide + 1) % featureImageList.length
            );
          }}
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/80"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Shop by category
          </h2>
          <div className={`grid grid-cols-2 md:grid-cols-${categories.length} lg:grid-cols-${categories.length} gap-4`}>
            {categories.map((categoryItem) => (
              <Card
                onClick={() =>
                  handleNavigateToListingPage(categoryItem, "category")
                }
                className="cursor-pointer hover:shadow-lg transition-shadow"
                key={categoryItem?._id}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  {/*<categoryItem.icon className="w-12 h-12 mb-4 text-primary" />*/}
                  <span className="font-bold">{categoryItem.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Shop by Brand</h2>
          <div className={`grid grid-cols-2 md:grid-cols-${brands.length} lg:grid-cols-${brands.length} gap-4`}>
            {brands.map((brandItem) => (
              <Card
                onClick={() => handleNavigateToListingPage(brandItem, "brand")}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                key={brandItem?._id}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  {/*<brandItem.icon className="w-12 h-12 mb-4 text-primary" />*/}
                  <span className="font-bold">{brandItem.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Feature Products
          </h2>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${featuredProducts.length} lg:grid-cols-${featuredProducts.length} gap-6`}>
            {featuredProducts && featuredProducts.length > 0
              ? featuredProducts.map((productItem) => (
                <ShoppingProductTile
                  handleGetProductDetails={handleGetProductDetails}
                  product={productItem}
                  handleAddtoCart={handleAddtoCart}
                  key={productItem?._id}
                />
              ))
              : null}
          </div>
        </div>
      </section>
      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />
    </div>
  );
}

export default ShoppingHome;