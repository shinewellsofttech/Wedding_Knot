import { Route, Routes } from "react-router-dom";
import Layout from "../Layout/Layout";
import { routes } from "./Route";
import { useUserRights } from "../contexts/UserRightsContext";

const LayoutRoutes = () => {
  const { hasAccess } = useUserRights();

  const filteredRoutes = routes.filter((r) => {
    const pathPart = (r.path || "").replace(new RegExp(`^${(process.env.PUBLIC_URL || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), "").replace(/^\//, "").toLowerCase();
    if (!pathPart) return true;
    return hasAccess(pathPart);
  });

  return (
    <Routes>
      {filteredRoutes.map(({ path, Component }, i) => (
        <Route element={<Layout />} key={i}>
          <Route path={path} element={Component} />
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
                    <a href={`${process.env.PUBLIC_URL || ""}/addEditItemMaster`} className="btn btn-primary">Go to Add/Edit Item Master</a>
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
