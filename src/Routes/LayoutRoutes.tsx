import { Route, Routes } from "react-router-dom";
import Layout from "../Layout/Layout";
import { routes } from "./Route";
import PermissionRoute from "./PermissionRoute";

const LayoutRoutes = () => {
  return (
    <Routes>
      {routes.map(({ path, Component }, i) => (
        <Route element={<Layout />} key={i}>
          <Route 
            path={path} 
            element={
              <PermissionRoute>
                {Component}
              </PermissionRoute>
            } 
          />
        </Route>
      ))}
      {/* Catch-all: access denied */}
      <Route path="*" element={<Layout />}>
        <Route
          path="*"
          element={
            <div className="page-body">
              <div className="container-fluid">
                <div className="row justify-content-center">
                  <div className="col-12 text-center py-5">
                    <h3>Access Denied</h3>
                    <p className="text-muted">You don&apos;t have permission to access this page.</p>
                    <a href={`${process.env.PUBLIC_URL || ""}/dashboard`} className="btn btn-primary">Go to Dashboard</a>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};

export default LayoutRoutes;
