import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserPermission {
    Id: number;
    F_RoleMaster: number;
    F_ModuleMaster: number;
    IsView: boolean;
    IsAdd: boolean;
    IsEdit: boolean;
    IsDelete: boolean;
    IsApprove: boolean;
    IsExport: boolean;
    F_BranchMaster: number | null;
    DateOfCreation?: string;
    ModuleName?: string;
    ModulePath?: string;
}

export interface ModuleMaster {
    Id: number;
    Name: string;
    Path: string;
    IsActive: boolean;
}

interface PermissionsState {
    permissions: UserPermission[];
    modules: ModuleMaster[];
    isLoaded: boolean;
    isLoading: boolean;
}

const initialState: PermissionsState = {
    permissions: [],
    modules: [],
    isLoaded: false,
    isLoading: false,
};

const PermissionsSlice = createSlice({
    name: "permissions",
    initialState,
    reducers: {
        setPermissions: (state, action: PayloadAction<UserPermission[]>) => {
            state.permissions = action.payload;
            state.isLoaded = true;
            state.isLoading = false;
        },
        setModules: (state, action: PayloadAction<ModuleMaster[]>) => {
            state.modules = action.payload;
        },
        setPermissionsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        clearPermissions: (state) => {
            state.permissions = [];
            state.modules = [];
            state.isLoaded = false;
            state.isLoading = false;
        },
    },
});

export const { setPermissions, setModules, setPermissionsLoading, clearPermissions } = PermissionsSlice.actions;

export default PermissionsSlice.reducer;
