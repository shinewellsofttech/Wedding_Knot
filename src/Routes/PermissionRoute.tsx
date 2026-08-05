import React from "react";
import { useLocation } from "react-router-dom";
import { usePermissions } from "../helpers/permissionsHelper";

interface PermissionRouteProps {
  children: React.ReactNode;
}

// Whitelist of paths that don't require permission check (utility/system pages)
const UNCONTROLLED_PATHS = [
  "/dashboard",
  "/login",
  "/logout",
  "/profile",
  "/settings",
  "/error",
  "/404",
  "/500",
  "/",
  "/customerOutstandingReport",
];

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children }) => {
  const location = useLocation();
  const { permissions, isLoaded } = usePermissions();
  
  // Get current path without PUBLIC_URL
  let currentPath = location.pathname.replace(process.env.PUBLIC_URL || "", "");
  if (!currentPath.startsWith("/")) {
    currentPath = "/" + currentPath;
  }
  
  // Check if path is in whitelist (utility pages that don't need permission)
  const isUncontrolledPath = UNCONTROLLED_PATHS.some(
    p => p.toLowerCase() === currentPath.toLowerCase()
  );
  
  if (isUncontrolledPath) {
    return <>{children}</>;
  }
  
  // Helper function to check permissions - exact path match required
  const checkPermission = (perms: any[]): boolean => {
    // If no permissions provided, DENY access
    if (!perms || perms.length === 0) return false;
    
    // Find exact permission for current path
    const permission = perms.find((p: any) => {
      let modulePath = p.ModulePath || "";
      if (!modulePath.startsWith("/")) {
        modulePath = "/" + modulePath;
      }
      return modulePath.toLowerCase() === currentPath.toLowerCase();
    });
    
    // If permission found, check IsView
    if (permission) {
      return permission.IsView === true;
    }
    
    // Path NOT in user's permissions - DENY access
    // User must have explicit permission for every controlled page
    return false;
  };
  
  // If permissions are loaded, enforce strict permission checking
  if (isLoaded) {
    // If isLoaded=true and permissions is empty, user's role has no permissions - DENY
    if (!permissions || permissions.length === 0) {
      return <AccessDenied />;
    }
    
    // Check permission from Redux store
    if (checkPermission(permissions)) {
      return <>{children}</>;
    }
    
    return <AccessDenied />;
  }
  
  // Permissions not loaded yet - fallback to localStorage
  const storedPermissions = localStorage.getItem("userPermissions");
  if (!storedPermissions) {
    // No permissions found anywhere yet - still loading, allow tentatively
    return <>{children}</>;
  }
  
  try {
    const parsedPermissions = JSON.parse(storedPermissions);
    // Empty localStorage permissions with no Redux data - DENY
    if (!parsedPermissions || parsedPermissions.length === 0) {
      return <AccessDenied />;
    }
    if (checkPermission(parsedPermissions)) {
      return <>{children}</>;
    }
    return <AccessDenied />;
  } catch (e) {
    return <AccessDenied />;
  }
};

const AccessDenied: React.FC = () => {
  return (
    <div className="page-body">
      <div className="container-fluid">
        <div className="row justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="col-12 text-center py-5">
            <div className="mb-4">
              <i className="fa fa-ban text-danger" style={{ fontSize: "80px" }}></i>
            </div>
            <h2 className="text-danger">Access Denied</h2>
            <p className="text-muted fs-5">You don't have permission to access this page.</p>
            <p className="text-muted">Please contact your administrator if you believe this is an error.</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => window.history.back()}
            >
              <i className="fa fa-arrow-left me-2"></i>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionRoute;
