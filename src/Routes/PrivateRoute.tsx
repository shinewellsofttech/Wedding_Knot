import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  let login = false;
  try {
    const raw = localStorage.getItem("login");
    if (raw && raw !== "undefined" && raw !== "null") {
      login = JSON.parse(raw);
    }
  } catch {
    login = false;
  }
  return login ? (
    <Outlet />
  ) : (
    <Navigate to={`${process.env.PUBLIC_URL}/login`} />
  );
};

export default PrivateRoute;