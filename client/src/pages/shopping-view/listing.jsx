import ProductFilter from "@/components/shopping-view/filter";
import ProductDetailsDialog from "@/components/shopping-view/product-details";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { sortOptions } from "@/config";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import {
  fetchAllFilteredProducts, fetchAllProducts,
  fetchProductDetails, fetchProductsOnBrandOrCategory
} from "@/store/shop/products-slice";
import { fetchTopBrands } from "@/store/shop/brand-slice";
import { fetchTopCategories } from "@/store/shop/category-slice";
import { ArrowUpDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

const createSearchParamsHelper = (params) => {
  const queryParams = [];

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value) && value.length > 0) {
      const paramValue = value.join(",");
      queryParams.push(`${key}=${encodeURIComponent(paramValue)}`);
    } else if (value !== undefined && value !== null) {
      queryParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  return queryParams.join("&");
};

const ShoppingListing = () => {
  const dispatch = useDispatch();
  const { productList, productDetails, filterList } = useSelector(
    (state) => state.shopProducts
  );
  const brands = useSelector((state) => state.shopBrands.brands);
  const categories = useSelector((state) => state.shopCategories.categories);
  const { cartItems } = useSelector((state) => state.shopCart);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const { toast } = useToast();

  const brand = searchParams.get("brand");
  const category = searchParams.get("category");
  const keyword = searchParams.get("keyword");

  const isBrandFilter = !!brand;
  const isCategoryFilter = !!category;
  const isSearchFilter = !!keyword;


  useEffect(() => {
    if (isBrandFilter) {
      dispatch(fetchProductsOnBrandOrCategory({ section: "brand", id: brand }));
    } else if (isCategoryFilter) {
      dispatch(fetchProductsOnBrandOrCategory({ section: "category", id: category }));
    } else if (isSearchFilter) {
      setFilters({});
      dispatch(fetchAllProducts(keyword?.trim())); // General search products
      
    }
  }, [dispatch, brand, category, keyword]);


  useEffect(() => {
    // Fetch top brands or categories if missing
    if (isBrandFilter && !brands.length) dispatch(fetchTopBrands());
    if (isCategoryFilter && !categories.length) dispatch(fetchTopCategories());
  }, [dispatch, isBrandFilter, isCategoryFilter, brands, categories]);



  useEffect(() => {
    if (!cartItems) dispatch(fetchCartItems())
  }, [cartItems, dispatch])

  const handleSort = (value) => {
    setSort(value);
    handleFilter("sort", value)
  }
  


  const handleFilter = (type, id) => {
    if (isBrandFilter || isCategoryFilter) {
      // Brand/Category Filters
      const newParams = { [type]: id };
      if (type === "brand") delete newParams.category;
      if (type === "category") delete newParams.brand;

      window.history.replaceState({}, "", `/shop/listing?${new URLSearchParams(newParams).toString()}`);
      dispatch(fetchProductsOnBrandOrCategory({ section: type, id }));
    } else if (isSearchFilter) {
      const updatedFilters = { ...filters };
      if (type === "price") {
        updatedFilters.minPrice = id.minPrice;
        updatedFilters.maxPrice = id.maxPrice; // Directly set the value for price range filters
      }else if(type === "sort"){
        updatedFilters.sort = id;
      } 
      else {
        // For other types (e.g., "Screen Size", "Color"), handle toggle logic
        if (!updatedFilters[type]) updatedFilters[type] = [];
        if (updatedFilters[type].includes(id)) {
          updatedFilters[type] = updatedFilters[type].filter((item) => item !== id);
          if (!updatedFilters[type].length) delete updatedFilters[type]; // Remove empty filters
        } else {
          updatedFilters[type].push(id);
        }
      }
      setFilters(updatedFilters);

      // Get current query parameters from URL
      const currentParams = Object.fromEntries([...searchParams]);

      // Merge updated filters into current query parameters
      const mergedParams = {
        ...currentParams,
        ...updatedFilters,
      };

      const queryParams = createSearchParamsHelper(mergedParams);
      setSearchParams(queryParams);

      dispatch(fetchAllFilteredProducts({ filters: updatedFilters, keyword }));
    }
  };


  const handleGetProductDetails = (getCurrentProductId) => {
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  const handleAddToCart = (productId, totalStock) => {

    // Check if the product is already in the cart
    const isProductInCart = cartItems.products.some((item) => item.product === productId);
  
    // Helper to dispatch addToCart and handle toast messages
    const dispatchAddToCart = (productId, quantity) => {
      dispatch(addToCart({ productId, quantity })).then((data) => {
        if (data.payload.code === "SUCCESS") {
          toast({
            title: "Added to Cart",
            description: `${data?.payload?.message}`,
          });
        } else {

          toast({
            title: "Error Adding to cart",
            description: data?.payload?.message,
            variant: "destructive",
          });
        }
      });
    };
  
    if (isProductInCart) {
      // Check if more quantity can be added
      const canAddMore = cartItems.products.some(
        (item) => item.product === productId && item.quantity < totalStock
      );
  
      if (canAddMore) {
        dispatchAddToCart(productId, 1);
      } else {
        toast({
          title: "Stock Overflow",
          description: "Can't add more quantity of this product",
          variant: "destructive",
        });
      }
    } else {
      // Add product to cart if not in the cart
      dispatchAddToCart(productId, 1);
    }

  };
  

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);



  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 p-4 md:p-6">
      <ProductFilter
        brands={isBrandFilter ? brands : []}
        categories={isCategoryFilter ? categories : []}
        filters={isBrandFilter || isCategoryFilter ? { brand, category } : filters}
        filterList={isSearchFilter ? filterList : []}
        handleFilter={handleFilter}
      />
      <div className="bg-background w-full rounded-lg shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-extrabold">All Products</h2>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              {productList?.length} Products
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ArrowUpDownIcon className="h-4 w-4" />
                  <span>Sort by</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuRadioGroup value={sort} onValueChange={(e)=> handleSort(e)}>
                  {sortOptions.map((sortItem) => (
                    <DropdownMenuRadioItem
                      value={sortItem.id}
                      key={sortItem.id}
                    >
                      {sortItem.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {productList && productList.length > 0
            ? productList.map((productItem) => (
              <ShoppingProductTile
                handleGetProductDetails={handleGetProductDetails}
                product={productItem}
                handleAddtoCart={handleAddToCart}
                key={productItem._id}
              />
            ))
            : (<div className="">No Products found!</div>)}
        </div>
      </div>
      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />
    </div>
  );
}

export default ShoppingListing;