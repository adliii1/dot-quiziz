import { Navigate, Outlet } from "react-router";

export const Guard = () => {
  const isLogged = localStorage.getItem("userActive");

  return isLogged ? <Outlet /> : <Navigate to={"/login"} />;
};
