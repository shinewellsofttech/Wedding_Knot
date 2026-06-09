import { useAppSelector } from "../ReduxToolkit/Hooks";
import { UserPermission } from "../ReduxToolkit/Reducers/PermissionsSlice";
import { API_HELPER } from "./ApiHelper";
import { API_WEB_URLS } from "../constants/constAPI";
import store from "../store";
import { setPermissions, setPermissionsLoading, clearPermissions } from "../ReduxToolkit/Reducers/PermissionsSlice";
import type { RootState } from "../store/reducers";

// Fetch permissions from API
export const fetchUserPermissions = async (roleId: number | string, branchId: number | string): Promise<UserPermission[]> => {
    try {
        store.dispatch(setPermissionsLoading(true));
        
        const FETCH_URL = `${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/RoleWisePermission/Id/${roleId}`;
        const MODULES_URL = `${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/ModuleMaster/Id/0`;
        
        console.log("=== PERMISSIONS FETCH ===");
        console.log("Fetching permissions from:", FETCH_URL);
        
        const [permResponse, modulesResponse] = await Promise.all([
            API_HELPER.apiGET(FETCH_URL),
            API_HELPER.apiGET(MODULES_URL)
        ]);
        
        // Parse permissions
        let rawPermissions: any[] = [];
        if (permResponse?.data?.dataList && Array.isArray(permResponse.data.dataList)) {
            rawPermissions = permResponse.data.dataList;
        } else if (permResponse?.dataList && Array.isArray(permResponse.dataList)) {
            rawPermissions = permResponse.dataList;
        } else if (Array.isArray(permResponse?.data)) {
            rawPermissions = permResponse.data;
        } else if (Array.isArray(permResponse)) {
            rawPermissions = permResponse;
        }

        // Parse modules
        let rawModules: any[] = [];
        if (modulesResponse?.data?.dataList && Array.isArray(modulesResponse.data.dataList)) {
            rawModules = modulesResponse.data.dataList;
        } else if (modulesResponse?.dataList && Array.isArray(modulesResponse.dataList)) {
            rawModules = modulesResponse.dataList;
        } else if (Array.isArray(modulesResponse?.data)) {
            rawModules = modulesResponse.data;
        } else if (Array.isArray(modulesResponse)) {
            rawModules = modulesResponse;
        }

        // Map ModulePath from modules to permissions
        const permissions: UserPermission[] = rawPermissions.map(p => {
            const module = rawModules.find(m => m.Id === p.F_ModuleMaster);
            return {
                ...p,
                ModuleName: module?.Name || p.ModuleName || "",
                ModulePath: module?.Path || p.ModulePath || "",
            };
        });
        
        console.log("Parsed permissions count:", permissions.length);
        
        store.dispatch(setPermissions(permissions));
        localStorage.setItem("userPermissions", JSON.stringify(permissions));
        
        return permissions;
    } catch (error) {
        console.error("Failed to fetch user permissions:", error);
        store.dispatch(setPermissionsLoading(false));
        return [];
    }
};

// Load permissions from localStorage (on app reload)
export const loadPermissionsFromStorage = (): UserPermission[] => {
    try {
        console.log("=== LOADING FROM STORAGE ===");
        
        // Load permissions
        const storedPermissions = localStorage.getItem("userPermissions");
        if (storedPermissions) {
            const permissions = JSON.parse(storedPermissions) as UserPermission[];
            console.log("Loaded permissions from storage:", permissions.length, "items");
            store.dispatch(setPermissions(permissions));
            return permissions;
        } else {
            console.log("No permissions found in localStorage");
        }
    } catch (error) {
        console.error("Failed to load from storage:", error);
    }
    return [];
};

// Clear permissions on logout
export const clearUserPermissions = () => {
    store.dispatch(clearPermissions());
    localStorage.removeItem("userPermissions");
};

// Get permission for a specific module by moduleId
export const getModulePermission = (moduleId: number, permissions: UserPermission[]): UserPermission | undefined => {
    return permissions.find(p => p.F_ModuleMaster === moduleId);
};

// Get permission by path using ModulePath from permissions
export const getPermissionByModulePath = (path: string, permissions: UserPermission[]): UserPermission | undefined => {
    let cleanPath = path.replace(process.env.PUBLIC_URL || "", "");
    if (!cleanPath.startsWith("/")) {
        cleanPath = "/" + cleanPath;
    }
    return permissions.find(p => {
        let modulePath = p.ModulePath || "";
        if (!modulePath.startsWith("/")) {
            modulePath = "/" + modulePath;
        }
        return modulePath.toLowerCase() === cleanPath.toLowerCase();
    });
};

// Check if user has view access to a module
export const hasViewAccess = (moduleId: number, permissions: UserPermission[]): boolean => {
    const perm = getModulePermission(moduleId, permissions);
    return perm?.IsView === true;
};

// Check if user has view access by path
export const hasViewAccessByPath = (path: string, permissions: UserPermission[]): boolean => {
    const perm = getPermissionByModulePath(path, permissions);
    return perm?.IsView === true;
};

// Permission check functions
export const hasAddAccess = (moduleId: number, permissions: UserPermission[]): boolean => {
    const perm = getModulePermission(moduleId, permissions);
    return perm?.IsAdd === true;
};

export const hasEditAccess = (moduleId: number, permissions: UserPermission[]): boolean => {
    const perm = getModulePermission(moduleId, permissions);
    return perm?.IsEdit === true;
};

export const hasDeleteAccess = (moduleId: number, permissions: UserPermission[]): boolean => {
    const perm = getModulePermission(moduleId, permissions);
    return perm?.IsDelete === true;
};

export const hasApproveAccess = (moduleId: number, permissions: UserPermission[]): boolean => {
    const perm = getModulePermission(moduleId, permissions);
    return perm?.IsApprove === true;
};

export const hasExportAccess = (moduleId: number, permissions: UserPermission[]): boolean => {
    const perm = getModulePermission(moduleId, permissions);
    return perm?.IsExport === true;
};

// Hook for using permissions in components
export const usePermissions = () => {
    const permissions = useAppSelector((state: RootState) => state.permissions?.permissions || []);
    const isLoaded = useAppSelector((state: RootState) => state.permissions?.isLoaded || false);
    
    // Get permission by path using ModulePath from permissions
    const getPermissionByPath = (path: string): UserPermission | undefined => {
        let cleanPath = path.replace(process.env.PUBLIC_URL || "", "");
        if (!cleanPath.startsWith("/")) {
            cleanPath = "/" + cleanPath;
        }
        return permissions.find(p => {
            let modulePath = p.ModulePath || "";
            if (!modulePath.startsWith("/")) {
                modulePath = "/" + modulePath;
            }
            return modulePath.toLowerCase() === cleanPath.toLowerCase();
        });
    };
    
    return {
        permissions,
        isLoaded,
        hasView: (moduleId: number) => hasViewAccess(moduleId, permissions),
        hasAdd: (moduleId: number) => hasAddAccess(moduleId, permissions),
        hasEdit: (moduleId: number) => hasEditAccess(moduleId, permissions),
        hasDelete: (moduleId: number) => hasDeleteAccess(moduleId, permissions),
        hasApprove: (moduleId: number) => hasApproveAccess(moduleId, permissions),
        hasExport: (moduleId: number) => hasExportAccess(moduleId, permissions),
        hasViewByPath: (path: string) => getPermissionByPath(path)?.IsView === true,
        getPermission: (moduleId: number) => getModulePermission(moduleId, permissions),
        getPermissionByPath,
    };
};
