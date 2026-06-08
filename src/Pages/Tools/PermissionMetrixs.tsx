import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Table, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import { Fn_FillListData, Fn_AddEditData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { toast } from "react-toastify";

interface DropdownState {
    roles: Array<{ Id?: number; Name?: string }>;
    modules: Array<{ Id?: number; Name?: string }>;
    branches: Array<{ Id?: number; Name?: string }>;
}

interface ModulePermission {
    Id: string; // unique row identifier
    ModuleId: number;
    ModuleName: string;
    CanView: boolean;
    CanAdd: boolean;
    CanEdit: boolean;
    CanDelete: boolean;
}

const mockModulesData = [
    { Id: 1, Name: "Customer Onboarding" },
    { Id: 2, Name: "KYC Management" },
    { Id: 3, Name: "Loan Application" },
    { Id: 4, Name: "Loan Approval" },
    { Id: 5, Name: "Disbursement" },
    { Id: 6, Name: "EMI Collection" },
    { Id: 7, Name: "Receipt Management" },
    { Id: 8, Name: "Overdue / NPA" },
    { Id: 9, Name: "Accounting / GL" },
    { Id: 10, Name: "Reports & MIS" },
    { Id: 11, Name: "Account Type Scheme" },
    { Id: 12, Name: "Loan Closure" },
    { Id: 13, Name: "Audit Trail" },
    { Id: 14, Name: "System Utilities" },
    { Id: 15, Name: "Gold Loan - Ornament" },
    { Id: 16, Name: "MFI / Group Lending" }
];

const PermissionMetrixs = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Refs for focus management
    const roleSelectRef = useRef<HTMLInputElement>(null);
    const moduleSelectRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const addButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const [selectedRole, setSelectedRole] = useState<string>("");
    const [permissions, setPermissions] = useState<ModulePermission[]>([]);
    const [isEditingOpen, setIsEditingOpen] = useState<boolean>(true);

    // State for Copy from another Role modal
    const [showCopyModal, setShowCopyModal] = useState<boolean>(false);
    const [sourceRole, setSourceRole] = useState<string>("");
    const [isCopying, setIsCopying] = useState<boolean>(false);

    const [dropdowns, setDropdowns] = useState<DropdownState>({
        roles: [],
        modules: [],
        branches: [],
    });

    const ROLE_API_URL = `${API_WEB_URLS.MASTER}/0/token/UserRole/Id/0`;
    const MODULE_API_URL = `${API_WEB_URLS.MASTER}/0/token/ModuleMaster/Id/0`;
    const BRANCH_API_URL = `${API_WEB_URLS.MASTER}/0/token/BranchOffice/Id/0`;

    // Auto-focus on page load
    useEffect(() => {
        if (roleSelectRef.current) {
            roleSelectRef.current.focus();
        }
    }, []);

    useEffect(() => {
        Fn_FillListData(dispatch, setDropdowns, "roles", ROLE_API_URL)
            .catch(err => console.error("Failed to fetch roles:", err));

        Fn_FillListData(dispatch, setDropdowns, "modules", MODULE_API_URL)
            .catch(err => console.error("Failed to fetch modules:", err));

        Fn_FillListData(dispatch, setDropdowns, "branches", BRANCH_API_URL)
            .catch(err => console.error("Failed to fetch branches:", err));
    }, [dispatch, ROLE_API_URL, MODULE_API_URL, BRANCH_API_URL]);

    // Initialize permissions based on fetched modules or API response
    useEffect(() => {
        // Start with one empty row
        const emptyRow: ModulePermission = {
            Id: Date.now().toString(),
            ModuleId: 0,
            ModuleName: "",
            CanView: false,
            CanAdd: false,
            CanEdit: false,
            CanDelete: false,
        };

        if (!selectedRole) {
            setPermissions([emptyRow]);
            return;
        }

        const FETCH_URL = `${API_WEB_URLS.MASTER}/0/token/RoleWisePermission/Id/${selectedRole}`;

        Fn_FillListData(dispatch, () => { }, "tempData", FETCH_URL)
            .then((data: any) => {
                const list = Array.isArray(data) ? data : (data?.Data || []);

                if (list.length === 0) {
                    setPermissions([emptyRow]);
                    return;
                }

                // Map fetched permissions to table rows
                const mappedPermissions = list.map((fetchedPerm: any) => {
                    const module = dropdowns.modules.find(m => m.Id === fetchedPerm.F_ModuleMaster);
                    return {
                        Id: `${fetchedPerm.F_ModuleMaster}-${Date.now()}-${Math.random()}`,
                        ModuleId: fetchedPerm.F_ModuleMaster || 0,
                        ModuleName: module?.Name || "",
                        CanView: !!fetchedPerm.IsView,
                        CanAdd: !!fetchedPerm.IsAdd,
                        CanEdit: !!fetchedPerm.IsEdit,
                        CanDelete: !!fetchedPerm.IsDelete,
                    };
                });

                setPermissions(mappedPermissions.length > 0 ? mappedPermissions : [emptyRow]);
            })
            .catch(err => {
                console.error("Failed to fetch role permissions:", err);
                setPermissions([emptyRow]);
            });

    }, [dispatch, selectedRole, dropdowns.modules]);

    const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRole(e.target.value);
    };

    // Keyboard navigation handlers
    const handleRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && permissions.length > 0) {
            e.preventDefault();
            const firstModuleRef = moduleSelectRefs.current[permissions[0].Id];
            if (firstModuleRef) {
                firstModuleRef.focus();
            }
        }
    };

    const handleModuleKeyDown = (rowId: string, rowIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            // Focus on the first checkbox (CanView) of the same row
            const checkboxes = document.querySelectorAll(`[data-row-id="${rowId}"][data-checkbox]`);
            if (checkboxes.length > 0) {
                (checkboxes[0] as HTMLInputElement).focus();
            }
        }
    };

    const handleCheckboxKeyDown = (rowId: string, currentField: string, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const checkboxOrder = ["CanView", "CanAdd", "CanEdit", "CanDelete"];
            const currentIndex = checkboxOrder.indexOf(currentField);
            
            if (currentIndex < checkboxOrder.length - 1) {
                // Move to next checkbox in the same row
                const nextField = checkboxOrder[currentIndex + 1];
                const nextCheckbox = document.querySelector(`[data-row-id="${rowId}"][data-checkbox="${nextField}"]`) as HTMLInputElement;
                if (nextCheckbox) {
                    nextCheckbox.focus();
                }
            } else {
                // Last checkbox, move to add button
                const addButton = addButtonRefs.current[rowId];
                if (addButton) {
                    addButton.focus();
                }
            }
        }
    };

    const handleAddButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddRow();
        }
    };

    const handleModuleChange = (rowId: string, selectedModuleId: string) => {
        const moduleId = parseInt(selectedModuleId);
        const module = dropdowns.modules.find(m => m.Id === moduleId);
        
        setPermissions(prev => prev.map(p => {
            if (p.Id === rowId) {
                return {
                    ...p,
                    ModuleId: moduleId,
                    ModuleName: module?.Name || ""
                };
            }
            return p;
        }));
    };

    const handleCheckboxToggle = (rowId: string, field: keyof ModulePermission) => {
        setPermissions(prev => prev.map(p => {
            if (p.Id === rowId) {
                return { ...p, [field]: !p[field] };
            }
            return p;
        }));
    };

    const handleSelectAllToggle = (rowId: string) => {
        setPermissions(prev => prev.map(p => {
            if (p.Id === rowId) {
                // Check if all are currently selected
                const allSelected = p.CanView && p.CanAdd && p.CanEdit && p.CanDelete;
                // Toggle all to opposite of current state
                const newValue = !allSelected;
                return {
                    ...p,
                    CanView: newValue,
                    CanAdd: newValue,
                    CanEdit: newValue,
                    CanDelete: newValue,
                };
            }
            return p;
        }));
    };

    const isRowEmpty = (row: ModulePermission) => {
        return row.ModuleId === 0 || !row.ModuleId;
    };

    const handleAddRow = () => {
        // Check if the last row is empty
        const lastRow = permissions[permissions.length - 1];
        if (lastRow && isRowEmpty(lastRow)) {
            toast.warning("Please fill the current row before adding a new one.");
            return;
        }

        const newRow: ModulePermission = {
            Id: Date.now().toString(),
            ModuleId: 0,
            ModuleName: "",
            CanView: false,
            CanAdd: false,
            CanEdit: false,
            CanDelete: false,
        };
        setPermissions(prev => [...prev, newRow]);
        
        // Focus on the new row's module select after a short delay
        setTimeout(() => {
            const newModuleRef = moduleSelectRefs.current[newRow.Id];
            if (newModuleRef) {
                newModuleRef.focus();
            }
        }, 100);
    };

    const handleRemoveRow = (rowId: string) => {
        setPermissions(prev => {
            const filtered = prev.filter(p => p.Id !== rowId);
            // Keep at least one row
            return filtered.length > 0 ? filtered : [{
                Id: Date.now().toString(),
                ModuleId: 0,
                ModuleName: "",
                CanView: false,
                CanAdd: false,
                CanEdit: false,
                CanDelete: false,
            }];
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) {
            toast.error("Please select a role first.");
            return;
        }

        // Only send modules that have been selected (ModuleId > 0)
        const selectedPermissions = permissions.filter(p => p.ModuleId > 0);

        if (selectedPermissions.length === 0) {
            toast.error("Please add at least one module permission.");
            return;
        }

        const dataJsonArray = selectedPermissions.map(p => ({
            F_ModuleMaster: p.ModuleId,
            IsView: p.CanView,
            IsAdd: p.CanAdd,
            IsEdit: p.CanEdit,
            IsDelete: p.CanDelete,
            IsApprove: false,
            IsExport: false
        }));

        const formData = new FormData();
        formData.append("F_RoleMaster", selectedRole);
        formData.append("F_BranchMaster", "0");
        formData.append("DataJSON", JSON.stringify(dataJsonArray));

        const storedUser = localStorage.getItem("user");
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const userId = currentUser?.uid ?? currentUser?.id ?? "0";
        formData.append("UserId", userId);
        formData.append("F_BranchOffice", localStorage.getItem("F_BranchOffice") || "");

        const apiSaveUrl = `RoleWisePermission/${userId}/token`;

        try {
            await Fn_AddEditData(
                dispatch,
                () => { }, // Placeholder for progress state setter 
                { arguList: { id: 0, formData } },
                apiSaveUrl,
                true,
                "memberid",
                navigate,
                null // null redirect url will stay on page
            );
            
            // Show success message
            toast.success("Permissions saved successfully!");
        } catch (error) {
            console.error("Failed to save permissions", error);
            toast.error("Failed to save permissions. Please try again.");
        }
    };

    // Handle Copy from another Role
    const handleCopyPermissions = async () => {
        if (!sourceRole) {
            toast.error("Please select a source role.");
            return;
        }

        if (!selectedRole) {
            toast.error("Please select a destination role first.");
            return;
        }

        if (sourceRole === selectedRole) {
            toast.error("Source and destination roles must be different.");
            return;
        }

        setIsCopying(true);

        try {
            // Fetch permissions from source role
            const FETCH_URL = `${API_WEB_URLS.MASTER}/0/token/RoleWisePermission/Id/${sourceRole}`;

            const data = await Fn_FillListData(dispatch, () => { }, "tempData", FETCH_URL);
            const list = Array.isArray(data) ? data : (data?.Data || []);

            if (list.length === 0) {
                toast.warning("Source role has no permissions to copy.");
                setIsCopying(false);
                return;
            }

            // Map fetched permissions to table rows
            const mappedPermissions = list.map((fetchedPerm: any) => {
                const module = dropdowns.modules.find(m => m.Id === fetchedPerm.F_ModuleMaster);
                return {
                    Id: `${fetchedPerm.F_ModuleMaster}-${Date.now()}-${Math.random()}`,
                    ModuleId: fetchedPerm.F_ModuleMaster || 0,
                    ModuleName: module?.Name || "",
                    CanView: !!fetchedPerm.IsView,
                    CanAdd: !!fetchedPerm.IsAdd,
                    CanEdit: !!fetchedPerm.IsEdit,
                    CanDelete: !!fetchedPerm.IsDelete,
                };
            });

            setPermissions(mappedPermissions);
            setShowCopyModal(false);
            setSourceRole("");
            toast.success(`Permissions copied from source role! Found ${mappedPermissions.length} modules.`);
        } catch (error) {
            console.error("Failed to copy permissions:", error);
            toast.error("Failed to copy permissions. Please try again.");
        } finally {
            setIsCopying(false);
        }
    };

    // Handle adding all modules at once
    const handleAddAllModules = () => {
        if (!selectedRole) {
            toast.error("Please select a role first.");
            return;
        }

        if (dropdowns.modules.length === 0) {
            toast.warning("No modules available to add.");
            return;
        }

        const existingModuleIds = permissions.map(p => p.ModuleId).filter(id => id > 0);
        const modulesToAdd = dropdowns.modules.filter(m => !existingModuleIds.includes(m.Id!));
        
        if (modulesToAdd.length === 0) {
            toast.info("All modules are already added.");
            return;
        }

        const newPermissions = modulesToAdd.map(module => ({
            Id: `${module.Id}-${Date.now()}-${Math.random()}`,
            ModuleId: module.Id || 0,
            ModuleName: module.Name || "",
            CanView: false,
            CanAdd: false,
            CanEdit: false,
            CanDelete: false,
        }));

        const currentPermissions = permissions.length === 1 && permissions[0].ModuleId === 0 
            ? [] 
            : permissions;

        setPermissions([...currentPermissions, ...newPermissions]);
        toast.success(`Added ${newPermissions.length} modules to the grid.`);
    };

    return (
        <div className="page-body">
            <Breadcrumbs mainTitle="Permission Matrix" parent="Setup & Admin" />
            <Container fluid>
                <Row>
                    <Col sm="12">
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                <Row className="mb-4">
                                    <Col md="4">
                                        <FormGroup>
                                            <Label className="fw-bold">
                                                Select Role <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="select"
                                                value={selectedRole}
                                                onChange={handleRoleChange}
                                                onKeyDown={handleRoleKeyDown}
                                                className="form-select"
                                                innerRef={roleSelectRef}
                                            >
                                                <option value="">-- Select Role --</option>
                                                {dropdowns.roles.map(role => (
                                                    <option key={role.Id} value={role.Id}>{role.Name || `Role ${role.Id}`}</option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <fieldset disabled={!isEditingOpen}>
                                    <div className="table-responsive border rounded" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                                        <Table className="table-bordered table-striped mb-0 table-hover align-middle">
                                            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                                <tr style={{ backgroundColor: "#1e3d73", color: "white" }}>
                                                    <th className="py-3 px-3 shadow-none border-0" style={{ backgroundColor: "#1e3d73", color: "white", minWidth: "250px" }}>
                                                        Module Name
                                                    </th>
                                                    <th className="text-center py-3 border-0" style={{ backgroundColor: "#1e3d73", color: "white", width: "100px" }}>
                                                        <i className="fa fa-check-square-o me-1"></i> Select All
                                                    </th>
                                                    <th className="text-center py-3 border-0" style={{ backgroundColor: "#1e3d73", color: "white", width: "80px" }}>
                                                        <i className="fa fa-eye text-white-50 me-1"></i> View
                                                    </th>
                                                    <th className="text-center py-3 border-0" style={{ backgroundColor: "#1e3d73", color: "white", width: "80px" }}>
                                                        <i className="fa fa-plus text-primary-light me-1" style={{ color: "#8bb6ff" }}></i> Add
                                                    </th>
                                                    <th className="text-center py-3 border-0" style={{ backgroundColor: "#1e3d73", color: "white", width: "80px" }}>
                                                        <i className="fa fa-pencil text-warning me-1"></i> Edit
                                                    </th>
                                                    <th className="text-center py-3 border-0" style={{ backgroundColor: "#1e3d73", color: "white", width: "80px" }}>
                                                        <i className="fa fa-trash text-white-50 me-1"></i> Delete
                                                    </th>

                                                    <th className="text-center py-3 border-0" style={{ backgroundColor: "#1e3d73", color: "white", width: "120px" }}>
                                                        <i className="fa fa-cogs me-1"></i> Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {permissions.map((perm, index) => (
                                                    <tr key={perm.Id}>
                                                        <td className="px-2 bg-white">
                                                            <Input
                                                                type="select"
                                                                value={perm.ModuleId}
                                                                onChange={(e) => handleModuleChange(perm.Id, e.target.value)}
                                                                onKeyDown={(e) => handleModuleKeyDown(perm.Id, index, e)}
                                                                className="form-select form-select-sm"
                                                                innerRef={(el) => {
                                                                    if (el && 'focus' in el) {
                                                                        moduleSelectRefs.current[perm.Id] = el as HTMLInputElement;
                                                                    }
                                                                }}
                                                            >
                                                                <option value="0">-- Select Module --</option>
                                                                {dropdowns.modules.map(module => (
                                                                    <option key={module.Id} value={module.Id}>
                                                                        {module.Name || `Module ${module.Id}`}
                                                                    </option>
                                                                ))}
                                                            </Input>
                                                        </td>
                                                        <td className="text-center bg-white">
                                                            <Input
                                                                type="checkbox"
                                                                className="checkbox_animated"
                                                                checked={perm.CanView && perm.CanAdd && perm.CanEdit && perm.CanDelete}
                                                                onChange={() => handleSelectAllToggle(perm.Id)}
                                                                title="Select/Deselect All Permissions"
                                                            />
                                                        </td>
                                                        <td className="text-center bg-white">
                                                            <Input
                                                                type="checkbox"
                                                                className="checkbox_animated"
                                                                checked={perm.CanView}
                                                                onChange={() => handleCheckboxToggle(perm.Id, "CanView")}
                                                                onKeyDown={(e) => handleCheckboxKeyDown(perm.Id, "CanView", e)}
                                                                data-row-id={perm.Id}
                                                                data-checkbox="CanView"
                                                            />
                                                        </td>
                                                        <td className="text-center bg-white">
                                                            <Input
                                                                type="checkbox"
                                                                className="checkbox_animated"
                                                                checked={perm.CanAdd}
                                                                onChange={() => handleCheckboxToggle(perm.Id, "CanAdd")}
                                                                onKeyDown={(e) => handleCheckboxKeyDown(perm.Id, "CanAdd", e)}
                                                                data-row-id={perm.Id}
                                                                data-checkbox="CanAdd"
                                                            />
                                                        </td>
                                                        <td className="text-center bg-white">
                                                            <Input
                                                                type="checkbox"
                                                                className="checkbox_animated"
                                                                checked={perm.CanEdit}
                                                                onChange={() => handleCheckboxToggle(perm.Id, "CanEdit")}
                                                                onKeyDown={(e) => handleCheckboxKeyDown(perm.Id, "CanEdit", e)}
                                                                data-row-id={perm.Id}
                                                                data-checkbox="CanEdit"
                                                            />
                                                        </td>
                                                        <td className="text-center bg-white">
                                                            <Input
                                                                type="checkbox"
                                                                className="checkbox_animated"
                                                                checked={perm.CanDelete}
                                                                onChange={() => handleCheckboxToggle(perm.Id, "CanDelete")}
                                                                onKeyDown={(e) => handleCheckboxKeyDown(perm.Id, "CanDelete", e)}
                                                                data-row-id={perm.Id}
                                                                data-checkbox="CanDelete"
                                                            />
                                                        </td>
                                                        <td className="text-center bg-white">
                                                            <div className="d-flex justify-content-center gap-2">
                                                                <Button
                                                                    color="success"
                                                                    size="sm"
                                                                    onClick={handleAddRow}
                                                                    onKeyDown={handleAddButtonKeyDown}
                                                                    title="Add Row"
                                                                    className="btn-sm px-2"
                                                                    innerRef={(el) => {
                                                                        addButtonRefs.current[perm.Id] = el;
                                                                    }}
                                                                >
                                                                    <i className="fa fa-plus"></i>
                                                                </Button>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveRow(perm.Id)}
                                                                    title="Remove Row"
                                                                    className="btn-sm px-2"
                                                                    disabled={permissions.length === 1}
                                                                >
                                                                    <i className="fa fa-minus"></i>
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {permissions.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="text-center text-muted py-4 bg-white">
                                                            No permissions added yet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </fieldset>

                                <div className="d-flex align-items-center gap-3 mt-4 pt-3 border-top">
                                    <Button color="primary" onClick={handleSavePermissions} disabled={!isEditingOpen}>
                                        <i className="fa fa-save me-2"></i> Save Permissions
                                    </Button>
                                    <Button color="info" onClick={() => setShowCopyModal(true)} disabled={!isEditingOpen || !selectedRole}>
                                        <i className="fa fa-copy me-2"></i> Copy from another Role
                                    </Button>
                                    <Button color="warning" onClick={handleAddAllModules} disabled={!isEditingOpen || !selectedRole || dropdowns.modules.length === 0}>
                                        <i className="fa fa-list-ul me-2"></i> Add All Modules
                                    </Button>
                                    <Button
                                        color="light"
                                        className="text-dark border"
                                        onClick={() => setIsEditingOpen(!isEditingOpen)}
                                    >
                                        <i className={`fa ${isEditingOpen ? "fa-lock" : "fa-pencil"} me-2`}></i>
                                        {isEditingOpen ? "Lock" : "Edit"}
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Copy from another Role Modal */}
                <Modal isOpen={showCopyModal} toggle={() => setShowCopyModal(false)} centered>
                    <ModalHeader toggle={() => setShowCopyModal(false)}>
                        <i className="fa fa-copy me-2"></i> Copy Permissions from Another Role
                    </ModalHeader>
                    <ModalBody>
                        <FormGroup>
                            <Label className="fw-bold">
                                Source Role <span className="text-danger">*</span>
                            </Label>
                            <Input
                                type="select"
                                value={sourceRole}
                                onChange={(e) => setSourceRole(e.target.value)}
                                className="form-select"
                            >
                                <option value="">-- Select Source Role --</option>
                                {dropdowns.roles.map(role => (
                                    <option key={role.Id} value={role.Id}>{role.Name || `Role ${role.Id}`}</option>
                                ))}
                            </Input>
                            <small className="text-muted d-block mt-1">Select the role from which you want to copy permissions</small>
                        </FormGroup>

                        <div className="alert alert-info" role="alert">
                            <i className="fa fa-info-circle me-2"></i>
                            <strong>Target Role:</strong> {dropdowns.roles.find(r => r.Id == parseInt(selectedRole))?.Name || `Role ${selectedRole}`}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={() => setShowCopyModal(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onClick={handleCopyPermissions} disabled={isCopying || !sourceRole}>
                            {isCopying ? (
                                <>
                                    <i className="fa fa-spinner fa-spin me-2"></i> Copying...
                                </>
                            ) : (
                                <>
                                    <i className="fa fa-copy me-2"></i> Copy Permissions
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                </Modal>
            </Container>
        </div>
    );
};

export default PermissionMetrixs;
