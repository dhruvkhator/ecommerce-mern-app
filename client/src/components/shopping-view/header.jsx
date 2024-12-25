import { HousePlug, LogOut, Menu, ShoppingCart, UserCog, Search } from "lucide-react";
import {Link,useNavigate} from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";;
import UserCartWrapper from "./cart-wrapper";
import { useEffect, useState } from "react";
import { fetchCartItems } from "@/store/shop/cart-slice";
import { logoutUser } from "@/store/auth-slice";


const HeaderRightContent = ({ setVisibility, visibility, setIsOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const [openCartSheet, setOpenCartSheet] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout =()=> {
    localStorage.removeItem('token');
    dispatch(logoutUser());
    console.log('User logged out successfully');
  }

  useEffect(() => {
    dispatch(fetchCartItems());
  }, [dispatch]);



  return (
    <div className="flex lg:items-center lg:flex-row flex-col gap-4 cursor-pointer">
      <Sheet open={openCartSheet} onOpenChange={() => setOpenCartSheet(false)}>
        <Button
          onClick={() => setOpenCartSheet(true)}
          variant="outline"
          size="icon"
          className="relative"

        >
          <ShoppingCart className="w-6 h-6 " />
          <span className="absolute top-[-5px] right-[2px] font-bold text-sm">
            {cartItems?.products?.length || 0}
          </span>
          <span className="sr-only">User cart</span>
        </Button>
        <UserCartWrapper
          setOpenCartSheet={setOpenCartSheet}
          setIsOpen={setIsOpen}
          cartItems={
            cartItems && cartItems?.products && cartItems?.products?.length > 0
              ? cartItems.products
              : []
          }
        />
        
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="bg-black">
            <AvatarFallback className="bg-black text-white font-extrabold">
              {user?.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="w-56">
          <DropdownMenuLabel>Logged in as {user?.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/shop/account")} className="cursor-pointer">
            <UserCog className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>      
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="md:hidden">

      <button 
        onClick={()=> {
          setVisibility(!visibility);
          setIsOpen(false)
        }} 
        className="text-left cursor-pointer font-bold">
           Search
      </button>
      </div>
    </div>
  );
}

const ShoppingHeader = () => {
  const navigate = useNavigate();
  const [visibility, setVisibility] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/shop/listing?keyword=${query.trim()}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Logo */}
        <Link to="/shop/home" className="flex items-center gap-2">
          <HousePlug className="h-6 w-6" />
          <span className="font-bold">Ecommerce</span>
        </Link>

        {/* Search Bar for Medium and Large Devices */}
        <div className="hidden md:flex w-full max-w-md mx-auto items-center gap-2">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(e.target.value);
            }}
          />
          <button
                className="p-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                onClick={() => {
                  const query = document.querySelector("input[type='text']").value;
                  handleSearch(query);
                }}
              >
                <Search />
              </button>
        </div>

        {/* Burger Icon for Small and Medium Devices */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setIsOpen(true)}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="w-full" onPointerDownOutside={() => setIsOpen(false)}>
            <div className="px-4 py-2">
              <HeaderRightContent setVisibility={setVisibility} visibility={visibility} setIsOpen={setIsOpen}/>
            </div>
          </SheetContent>
        </Sheet>

        {/* Account and Cart Options for Large Devices */}
        <div className="hidden lg:block">
          <HeaderRightContent setIsOpen={setIsOpen}/>
        </div>
      </div>

      <div className="">
      <div className={`px-4 py-2 flex items-center gap-2 ${visibility ? 'flex' : 'hidden'}`}>
              <input
                type="text"
                placeholder="Search products..."
                className="w-full block md:hidden px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(e.target.value);
                }}
              />
              <button
                className="px-4 py-2 bg-primary md:hidden text-white rounded-md hover:bg-primary-dark"
                onClick={() => {
                  const query = document.querySelector("input[type='text']").value;
                  handleSearch(query);
                }}
              >
                <Search />
              </button>
            </div>
      </div>
    </header>
  );
};




export default ShoppingHeader;