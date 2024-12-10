
import { Navigate, useLocation } from 'react-router-dom'

const CheckAuth = ({ isAuthenticated, user, children }) => {

    const location = useLocation();

    console.log(location.pathname, isAuthenticated);

  if (location.pathname === "/") {
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" />;
    } else {
        return <Navigate to="/shop/home" />;
    }
  }

    if (!isAuthenticated && !(location.pathname.includes("/login") || location.pathname.includes("/register"))) {
        return <Navigate to="/auth/login" />;
    }


    if (isAuthenticated && (location.pathname.includes("/login") || location.pathname.includes("/register"))) {
        if (user?.role === "User") {
          return <Navigate to="/shop/home" />
    }}

    if (isAuthenticated && user?.role !=="User") {
        return <Navigate to="/unauth-page" />;
    }

    return (
        <>{children}</>
    )
}

export default CheckAuth