import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import LayoutRoutes from "./LayoutRoutes";
import Login from "../Component/Authentication/Login";

const RouterData = () => {
  const login = localStorage.getItem("login");
  return (
    <BrowserRouter basename={"/"}>
      <Routes>
        {login ? (
          <>
            <Route path={`${process.env.PUBLIC_URL}` || "/"} element={<Navigate to={`${process.env.PUBLIC_URL}/dashboard`} />} />
          </>
        ) : (
          ""
        )}
        <Route path={"/"} element={<PrivateRoute />}>
          <Route path={`/*`} element={<LayoutRoutes />} />
        </Route>
        <Route path={`${process.env.PUBLIC_URL}/login`} element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterData;
