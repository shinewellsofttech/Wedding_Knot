import React, { useState, useEffect, useRef, useCallback } from "react";
import { Col, Row, Card, CardBody, CardHeader, Container } from "reactstrap";
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData, Fn_DeleteData } from "../../../store/Functions";
import { useDispatch } from "react-redux";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { useLocation, useNavigate } from "react-router-dom";
import GridSystemPurchaseReturn from "./GridSystemPurchaseReturn";
import { getCurrentDateYYYYMMDD } from "../../../helpers/dateUtils";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Btn } from "../../../AbstractElements";

const API_URL_SAVE = "PurchaseReturnH/0/token";
const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/PurchaseReturnH/Id`;
const API_URL_DELETE = `${API_WEB_URLS.MASTER}/0/token/PurchaseReturnH`;
const API_URL_LINES = `${API_WEB_URLS.MASTER}/0/token/PurchaseReturnLById`;
const API_URL_FETCH_NO = `${API_WEB_URLS.MASTER}/0/token/GetPurchaseReturnNo`;
const API_URL_CREATED = `${API_WEB_URLS.MASTER}/0/token/CreatedPurchaseReturns/Id/0`;
const API_URL_VENDOR = `${API_WEB_URLS.MASTER}/0/token/VendorMaster/Id/0`;
const API_URL_ITEM_GROUP = `${API_WEB_URLS.MASTER}/0/token/ItemGroupMaster/Id/0`;
const API_URL_ITEM_BY_GROUP = `${API_WEB_URLS.MASTER}/0/token/ItemMasterById`;
const API_URL_ITEM_BY_CODE = `${API_WEB_URLS.MASTER}/0/token/ItemMasterByItemCode/Id/0`;
const API_URL_COLOR = `${API_WEB_URLS.MASTER}/0/token/ColorMaster/Id/0`;
const API_URL_BARCODE = `${API_WEB_URLS.MASTER}/0/token/ItemMasterByBarcode/Id`;

const RETURN_CONDITIONS = ["Fresh", "Replacement", "Scrap"];
const RETURN_STATUS_MAP = {
  Fresh: 1,
  Replacement: 2,
  Scrap: 3,
};

interface GridRow {
  BarCodeId: string;
  F_PurchaseMasterL: string;
  ItemCode: string;
  F_ItemGroupMaster: string;
  F_ItemMaster: string;
  F_ColorMaster: string;
  ReturnCondition: string;
  Qty: string;
  ItemData: any[] | null;
}

interface FormDataType {
  ReturnNo: string;
  ReturnDate: string;
  F_VendorMaster: string;
  F_PurchaseReturn: string;
  ReturnType: string;
  F_ReturnStatus: string;
  Remarks: string;
  F_PurchaseMasterH: string;
  F_StatusMaster: string;
}

interface StateType {
  id: number;
  formData: FormDataType;
  VendorMaster: any[];
  ItemGroupMaster: any[];
  ColorMaster: any[];
  CreatedPurchaseReturns: any[];
  DefaultColor: any;
  itemColorApplyMap: { [key: string]: boolean };
  isEditMode: boolean;
}

const createReturnRow = (condition = "Fresh"): GridRow => ({
  BarCodeId: "",
  F_PurchaseMasterL: "",
  ItemCode: "",
  F_ItemGroupMaster: "",
  F_ItemMaster: "",
  F_ColorMaster: "",
  ReturnCondition: condition,
  Qty: "",
  ItemData: null,
});

const PurchaseReturn: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const returnNoRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);
  const vendorRef = useRef<HTMLSelectElement>(null);
  const returnTypeRef = useRef<HTMLSelectElement>(null);
  const remarksRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<StateType>({
    id: 0,
    formData: {
      ReturnNo: "",
      ReturnDate: getCurrentDateYYYYMMDD(),
      F_VendorMaster: "",
      F_PurchaseReturn: "",
      ReturnType: "Fresh",
      F_ReturnStatus: "Fresh",
      Remarks: "",
      F_PurchaseMasterH: "0",
      F_StatusMaster: "0",
    },
    VendorMaster: [],
    ItemGroupMaster: [],
    ColorMaster: [],
    CreatedPurchaseReturns: [],
    DefaultColor: null,
    itemColorApplyMap: {},
    isEditMode: false,
  });

  const [gridRows, setGridRows] = useState<GridRow[]>([createReturnRow()]);

  const getLastCreatedPurchaseReturnId = (sourceList?: any[]): any => {
    const list = Array.isArray(sourceList) && sourceList.length > 0
      ? sourceList
      : (state.CreatedPurchaseReturns || []);

    if (!Array.isArray(list) || list.length === 0) {
      return null;
    }

    const lastEntry = list[list.length - 1];
    return (
      lastEntry?.Id ??
      lastEntry?.id ??
      lastEntry?.F_PurchaseReturn ??
      lastEntry?.PurchaseReturnId ??
      lastEntry?.PurchaseReturnID ??
      null
    );
  };

  const setSelectedPurchaseReturn = (returnId: string) => {
    if (!returnId) return;
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        F_PurchaseReturn: returnId,
      },
    }));
  };

  const loadPurchaseReturnRecord = async (recordId: any): Promise<boolean> => {
    if (!recordId) return false;
    await DataFillFunction(recordId);
    setSelectedPurchaseReturn(recordId);
    return true;
  };

  const selectLastPurchaseReturnRecord = async (listOverride?: any[]): Promise<any> => {
    const targetId = getLastCreatedPurchaseReturnId(listOverride);
    if (!targetId) return null;
    await loadPurchaseReturnRecord(targetId);
    return targetId;
  };

  const resolveReturnStatusLabel = useCallback((value: any): string => {
    if (value == null || value === "") {
      return "Fresh";
    }
    const entry = Object.entries(RETURN_STATUS_MAP).find(
      ([, statusId]) => String(statusId) === String(value)
    );
    if (entry) {
      return entry[0];
    }
    if (RETURN_CONDITIONS.includes(value)) {
      return value;
    }
    return "Fresh";
  }, []);

  const requestPurchaseReturnNo = useCallback(async (): Promise<string> => {
    try {
      const returnNoResponse = await Fn_FillListData(
        dispatch,
        setState,
        "GetPurchaseReturnNo",
        `${API_URL_FETCH_NO}/Id/0`
      );
      if (Array.isArray(returnNoResponse) && returnNoResponse.length > 0) {
        return (
          returnNoResponse[0].ReturnNo ||
          returnNoResponse[0].PRNo ||
          returnNoResponse[0].PrNo ||
          returnNoResponse[0].PRNO ||
          ""
        );
      }
    } catch (error) {
      console.error("Failed to generate Purchase Return number", error);
    }
    return "";
  }, [dispatch]);

  const fetchReturnNumber = useCallback(async () => {
    const generatedNo = await requestPurchaseReturnNo();
    if (generatedNo) {
      setState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          ReturnNo: generatedNo,
        },
      }));
    }
  }, [requestPurchaseReturnNo]);

  const fetchInitialData = useCallback(async () => {
    try {
      await Fn_FillListData(dispatch, setState, "VendorMaster", API_URL_VENDOR);
      await Fn_FillListData(dispatch, setState, "ItemGroupMaster", API_URL_ITEM_GROUP);
      const colorResponse = await Fn_FillListData(dispatch, setState, "ColorMaster", API_URL_COLOR);
      await Fn_FillListData(dispatch, setState, "CreatedPurchaseReturns", API_URL_CREATED);

      if (Array.isArray(colorResponse) && colorResponse.length > 0) {
        const defaultColor =
          colorResponse.find(
            (color) =>
              color.IsDefault === true || color.IsDefault === 1 || color.IsDefault === "1"
          ) || colorResponse[0];
        setState((prev) => ({
          ...prev,
          DefaultColor: defaultColor,
        }));
      }

      await fetchReturnNumber();
    } catch (error) {
      console.error("Error fetching purchase return data", error);
    }
  }, [dispatch, fetchReturnNumber]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (returnNoRef.current) {
      returnNoRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    if (locationState?.Id) {
      DataFillFunction(locationState.Id);
    }
  }, [location.state]);

  const addRow = useCallback(() => {
    setGridRows((prev) => [...prev, createReturnRow(state.formData.ReturnType || "Fresh")]);
  }, [state.formData.ReturnType]);

  const removeRow = useCallback((index: number) => {
    setGridRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const getItemColorApply = useCallback(
    async (itemId: string, forceRefresh = false): Promise<boolean> => {
      try {
        if (!itemId) return true;
        if (
          !forceRefresh &&
          Object.prototype.hasOwnProperty.call(state.itemColorApplyMap, itemId)
        ) {
          return state.itemColorApplyMap[itemId];
        }

        const response = await Fn_FillListData(
          dispatch,
          setState,
          "ItemMaster",
          `${API_WEB_URLS.MASTER}/0/token/ItemMaster/Id/${itemId}`
        );
        if (Array.isArray(response) && response.length > 0) {
          const item = response[0];
          const requiresColor =
            item.ItemColorApply === "1" ||
            item.ItemColorApply === 1 ||
            item.ItemColorApply === true;
          setState((prev) => ({
            ...prev,
            itemColorApplyMap: {
              ...prev.itemColorApplyMap,
              [itemId]: requiresColor,
            },
          }));
          return requiresColor;
        }
        return true;
      } catch (error) {
        console.error("Error fetching item color apply", error);
        return true;
      }
    },
    [dispatch, state.itemColorApplyMap]
  );

  const populateRowFromItem = useCallback(
    async (index: number, matchedItem: any, options: any = {}): Promise<boolean> => {
      if (!matchedItem) return false;

      const currentRows = gridRows;
      const currentRow = currentRows[index] || {};
      const itemGroupId = matchedItem.F_ItemGroupMaster;
      const itemId = matchedItem.Id;

      const itemRequiresColor = await getItemColorApply(itemId, true);
      const defaultColorId = itemRequiresColor ? "" : (state.DefaultColor?.Id || "");
      const resolvedColorId = itemRequiresColor
        ? options.colorId ?? currentRow.F_ColorMaster ?? ""
        : options.colorId ?? defaultColorId;

      const isDuplicate = currentRows.some(
        (row, i) =>
          i !== index &&
          row.F_ItemGroupMaster === itemGroupId &&
          row.F_ItemMaster === itemId &&
          (itemRequiresColor ? (row.F_ColorMaster || "") === (resolvedColorId || "") : true)
      );

      if (isDuplicate) {
        alert("This item, group, and color combination is already selected in another row.");
        return false;
      }

      let itemList: any[] = [];
      try {
        const res = await Fn_FillListData(
          dispatch,
          setState,
          "ItemData",
          `${API_URL_ITEM_BY_GROUP}/Id/${itemGroupId}`
        );
        itemList = Array.isArray(res) ? res : [];
      } catch (error) {
        console.error("Error loading items for the selected item group.", error);
        alert(`Error loading items for the selected item group. Please try again.`);
        return false;
      }

      setGridRows((prevRows) =>
        prevRows.map((row, i) => {
          if (i !== index) return row;
          return {
            ...row,
            BarCodeId:
              options.barCodeId ??
              row.BarCodeId ??
              matchedItem.BarCodeId ??
              matchedItem.BarcodeId ??
              matchedItem.BarCodeID ??
              matchedItem.BarcodeID ??
              matchedItem.BarCode ??
              matchedItem.Barcode ??
              "",
            F_PurchaseMasterL: matchedItem.F_PurchaseMasterL ?? row.F_PurchaseMasterL ?? "",
            ItemCode: matchedItem.ItemCode || row.ItemCode || "",
            F_ItemGroupMaster: itemGroupId,
            F_ItemMaster: itemId,
            F_ColorMaster: itemRequiresColor
              ? resolvedColorId || ""
              : state.DefaultColor?.Id || row.F_ColorMaster || "",
            ItemData: itemList,
          };
        })
      );

      return true;
    },
    [dispatch, getItemColorApply, gridRows, state.DefaultColor?.Id]
  );

  const updateGridRow = useCallback(
    async (index: number, field: string, value: any) => {
      if (field === "Barcode") {
        setGridRows((prevRows) =>
          prevRows.map((row, i) => (i === index ? { ...row, BarCodeId: value } : row))
        );
        return;
      }

      if (field === "BarcodeSearch") {
        const barcodeValue = String(value || "").trim();
        if (!barcodeValue) return;
        try {
          const result = await Fn_FillListData(
            dispatch,
            setState,
            "ItemMasterByBarcode",
            `${API_URL_BARCODE}/0`
          );
          if (Array.isArray(result) && result.length > 0) {
            const normalizedValue = barcodeValue.toLowerCase();
            const matched =
              result.find((item) => {
                const possibleId =
                  item?.BarCodeId ??
                  item?.BarcodeId ??
                  item?.BarCodeID ??
                  item?.BarcodeID ??
                  item?.BarCode ??
                  item?.Barcode;
                return (
                  possibleId !== undefined &&
                  String(possibleId).trim().toLowerCase() === normalizedValue
                );
              }) || null;

            if (matched) {
              await populateRowFromItem(index, matched, {
                barCodeId:
                  matched?.BarCodeId ??
                  matched?.BarcodeId ??
                  matched?.BarCodeID ??
                  matched?.BarcodeID ??
                  matched?.BarCode ??
                  matched?.Barcode ??
                  barcodeValue,
              });
              return;
            }
          }

          console.warn(
            `Barcode ${barcodeValue} not found in master. Please select item manually.`
          );
          setGridRows((prevRows) =>
            prevRows.map((row, i) =>
              i === index ? { ...row, BarCodeId: barcodeValue } : row
            )
          );
          alert(
            "Barcode not found. Please select the item manually; the scanned barcode will be saved with it."
          );
        } catch (error) {
          console.error("Error fetching item by barcode", error);
        }
        return;
      }

      if (field === "ItemCode") {
        setGridRows((prevRows) =>
          prevRows.map((row, i) => (i === index ? { ...row, ItemCode: value } : row))
        );
        return;
      }

      if (field === "ItemCodeSearch") {
        setTimeout(async () => {
          try {
            const result = await Fn_FillListData(
              dispatch,
              setState,
              "ItemMaster",
              API_URL_ITEM_BY_CODE
            );
            const matchedItem = result?.find(
              (item: any) => item.ItemCode?.toLowerCase() === value.toLowerCase()
            );
            if (!matchedItem) {
              setGridRows((rows) =>
                rows.map((row, i) =>
                  i === index
                    ? {
                        ...createReturnRow(state.formData.ReturnType),
                        BarCodeId: row.BarCodeId,
                      }
                    : row
                )
              );
              return;
            }

            await populateRowFromItem(index, matchedItem, {
              barCodeId:
                matchedItem?.BarCodeId ??
                matchedItem?.BarcodeId ??
                matchedItem?.BarCodeID ??
                matchedItem?.BarcodeID,
            });
          } catch (err) {
            console.error("Item code search failed", err);
          }
        }, 0);
        return;
      }

      if (field === "F_ItemGroupMaster") {
        setGridRows((prevRows) => {
          const updatedRows = prevRows.map((row, i) =>
            i === index
              ? {
                  ...row,
                  F_ItemGroupMaster: value,
                  F_ItemMaster: "",
                  ItemData: [],
                  BarCodeId: "",
                  ItemCode: "",
                }
              : row
          );

          setTimeout(async () => {
            if (!value) {
              setGridRows((rows) =>
                rows.map((row, i) =>
                  i === index
                    ? {
                        ...createReturnRow(state.formData.ReturnType),
                        BarCodeId: row.BarCodeId,
                      }
                    : row
                )
              );
              return;
            }
            try {
              const items = await Fn_FillListData(
                dispatch,
                setState,
                "ItemData",
                `${API_URL_ITEM_BY_GROUP}/Id/${value}`
              );
              setGridRows((rows) =>
                rows.map((row, i) =>
                  i === index
                    ? {
                        ...row,
                        F_ItemGroupMaster: value,
                        F_ItemMaster: "",
                        ItemData: Array.isArray(items) ? items : [],
                        BarCodeId: "",
                        ItemCode: "",
                      }
                    : row
                )
              );
            } catch (err) {
              console.error("Error loading item group data", err);
            }
          }, 0);

          return updatedRows;
        });
        return;
      }

      if (field === "F_ItemMaster") {
        setGridRows((prevRows) =>
          prevRows.map((row, i) => (i === index ? { ...row, F_ItemMaster: value } : row))
        );

        if (value) {
          setTimeout(async () => {
            const requiresColor = await getItemColorApply(value);
            const defaultColorId = requiresColor ? "" : state.DefaultColor?.Id || "";
            setGridRows((rows) =>
              rows.map((row, i) => {
                if (i !== index) return row;
                const itemList = Array.isArray(row.ItemData) ? row.ItemData : [];
                const selectedItem = itemList.find((item: any) => item.Id === value);
                const existingBarcode =
                  row.BarCodeId && String(row.BarCodeId).trim() !== "" ? row.BarCodeId : "";
                const selectedBarcode =
                  selectedItem?.BarCodeId ??
                  selectedItem?.BarcodeId ??
                  selectedItem?.BarCodeID ??
                  selectedItem?.BarcodeID ??
                  selectedItem?.BarCode ??
                  selectedItem?.Barcode ??
                  "";

                return {
                  ...row,
                  F_ItemMaster: value,
                  F_ColorMaster: defaultColorId,
                  ItemCode: selectedItem?.ItemCode ?? row.ItemCode ?? "",
                  BarCodeId: existingBarcode || selectedBarcode || "",
                };
              })
            );
          }, 0);
        } else {
          setGridRows((prevRows) =>
            prevRows.map((row, i) =>
              i === index
                ? { ...row, F_ItemMaster: "", F_ColorMaster: "", ItemCode: "", BarCodeId: "" }
                : row
            )
          );
        }
        return;
      }

      if (field === "F_ColorMaster") {
        setGridRows((prevRows) =>
          prevRows.map((row, i) => (i === index ? { ...row, F_ColorMaster: value } : row))
        );
        return;
      }

      if (field === "ReturnCondition") {
        setGridRows((prevRows) =>
          prevRows.map((row, i) => (i === index ? { ...row, ReturnCondition: value } : row))
        );
        return;
      }

      if (field === "Qty") {
        setGridRows((prevRows) =>
          prevRows.map((row, i) => (i === index ? { ...row, Qty: value } : row))
        );
        return;
      }

      setGridRows((prevRows) =>
        prevRows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      );
    },
    [
      dispatch,
      getItemColorApply,
      gridRows,
      populateRowFromItem,
      state.DefaultColor?.Id,
      state.formData.ReturnType,
    ]
  );

  const handleCreatedReturnChange = useCallback(async (returnId: string) => {
    if (!returnId) return;
    await loadPurchaseReturnRecord(returnId);
    setSelectedPurchaseReturn(returnId);
  }, []);

  const handleFormKeyDown = useCallback((event: React.KeyboardEvent<any>, fieldName: string) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    switch (fieldName) {
      case "ReturnNo":
        returnDateRef.current?.focus();
        break;
      case "ReturnDate":
        vendorRef.current?.focus();
        break;
      case "F_VendorMaster":
        returnTypeRef.current?.focus();
        break;
      case "ReturnType":
        remarksRef.current?.focus();
        break;
      case "Remarks":
        setTimeout(() => {
          const selectors = [
            'input[data-row="0"][data-field="Barcode"]',
            'input[data-row="0"][data-field="ItemCode"]',
            'select[data-row="0"][data-field="F_ItemGroupMaster"]',
          ];
          const target = selectors
            .map((selector) => document.querySelector(selector))
            .find(Boolean) as HTMLElement | undefined;
          target?.focus();
        }, 100);
        break;
      default:
        break;
    }
  }, []);

  async function DataFillFunction(id: any) {
    if (!id) return;

    try {
      const headerData = await Fn_DisplayData(dispatch, setState, id, API_URL_EDIT, {
        autoAssign: false,
      });
      const linesData = await Fn_FillListData(
        dispatch,
        setState,
        "ReturnLines",
        `${API_URL_LINES}/Id/${id}`
      );

      if (Array.isArray(headerData) && headerData.length > 0) {
        const header = headerData[0];

        setState((prev) => {
          const resolvedStatusForType =
            header.ReturnType ??
            header.F_ReturnStatus ??
            header.ReturnStatus ??
            header.Status ??
            prev.formData.ReturnType ??
            "Fresh";
          const resolvedStatusForStatus =
            header.F_ReturnStatus ??
            header.ReturnType ??
            header.ReturnStatus ??
            header.Status ??
            prev.formData.F_ReturnStatus ??
            prev.formData.ReturnType ??
            "Fresh";
          const resolvedReturnNo =
            header.ReturnNo ??
            header.PRNo ??
            header.PRNO ??
            header.PrNo ??
            header.Prno ??
            header.PR_Number ??
            prev.formData.ReturnNo ??
            "";
          const rawDate =
            header.ReturnDate ??
            header.PRDate ??
            header.PRDATE ??
            header.PrDate ??
            header.PR_Date ??
            header.PurchaseReturnDate;
          const mappedDate = rawDate
            ? new Date(rawDate).toISOString().split("T")[0]
            : getCurrentDateYYYYMMDD();

          return {
            ...prev,
            isEditMode: true,
            formData: {
              ...prev.formData,
              F_PurchaseReturn: id,
              ReturnNo: resolvedReturnNo,
              ReturnDate: mappedDate,
              F_VendorMaster: header.F_VendorMaster || "",
              Remarks:
                header.Remarks || header.Remark || header.Description || header.Notes || "",
              ReturnType: resolveReturnStatusLabel(resolvedStatusForType),
              F_ReturnStatus: resolveReturnStatusLabel(resolvedStatusForStatus),
              F_PurchaseMasterH:
                header.F_PurchaseMasterH != null
                  ? String(header.F_PurchaseMasterH)
                  : header.F_PurchaseMaster != null
                  ? String(header.F_PurchaseMaster)
                  : prev.formData.F_PurchaseMasterH || "0",
              F_StatusMaster:
                header.F_StatusMaster != null
                  ? String(header.F_StatusMaster)
                  : prev.formData.F_StatusMaster || "0",
            },
          };
        });
      }

      if (Array.isArray(linesData) && linesData.length > 0) {
        const mappedRows = await Promise.all(
          linesData.map(async (line: any) => {
            const requiresColor = await getItemColorApply(line.F_ItemMaster, true);
            const defaultColorId = requiresColor ? line.F_ColorMaster || "" : state.DefaultColor?.Id || "";

            return {
              BarCodeId:
                line.BarCodeId ||
                line.BarcodeId ||
                line.BarCodeID ||
                line.BarcodeID ||
                line.BarCode ||
                line.Barcode ||
                "",
              F_PurchaseMasterL: line.F_PurchaseMasterL || "",
              ItemCode: line.ItemCode || "",
              F_ItemGroupMaster: line.F_ItemGroupMaster || "",
              F_ItemMaster: line.F_ItemMaster || "",
              F_ColorMaster: defaultColorId,
              ReturnCondition:
                line.ReturnCondition || line.Condition || state.formData.ReturnType || "Fresh",
              Qty: String(line.Qty || line.Quantity || ""),
              ItemData: null,
            };
          })
        );

        setGridRows(mappedRows);

        mappedRows.forEach(async (row, idx) => {
          if (row.F_ItemGroupMaster) {
            const items = await Fn_FillListData(
              dispatch,
              setState,
              "ItemData",
              `${API_URL_ITEM_BY_GROUP}/Id/${row.F_ItemGroupMaster}`
            );
            setGridRows((rows) =>
              rows.map((r, i) =>
                i === idx ? { ...r, ItemData: Array.isArray(items) ? items : [] } : r
              )
            );
          }
        });
      } else {
        setGridRows([createReturnRow(state.formData.ReturnType)]);
      }
    } catch (error) {
      console.error("Failed to load purchase return", error);
    }
  }

  const handleReset = useCallback(async () => {
    const today = getCurrentDateYYYYMMDD();
    setState((prev) => ({
      ...prev,
      isEditMode: false,
      formData: {
        ...prev.formData,
        ReturnNo: "",
        ReturnDate: today,
        F_VendorMaster: "",
        F_PurchaseReturn: "",
        ReturnType: "Fresh",
        F_ReturnStatus: "Fresh",
        Remarks: "",
        F_PurchaseMasterH: "0",
        F_StatusMaster: "0",
      },
    }));

    setGridRows([createReturnRow()]);

    await fetchReturnNumber();
    setTimeout(() => {
      if (returnNoRef.current) returnNoRef.current.focus();
    }, 0);
  }, [fetchReturnNumber]);

  const handleCancel = useCallback(async () => {
    const loadedId = await selectLastPurchaseReturnRecord();
    if (!loadedId) {
      await handleReset();
    }
  }, [handleReset]);

  const ensureReturnNumber = useCallback(
    async (currentNo: string): Promise<string> => {
      if (state.formData.F_PurchaseReturn) {
        return currentNo;
      }

      if (currentNo?.trim()) {
        return currentNo;
      }

      const generatedNo = await requestPurchaseReturnNo();
      if (generatedNo) {
        setState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            ReturnNo: generatedNo,
          },
        }));
        return generatedNo;
      }

      return currentNo;
    },
    [requestPurchaseReturnNo, state.formData.F_PurchaseReturn]
  );

  const handleReturnTypeChange = useCallback((value: string) => {
    setState((prev) => {
      const prevType = prev.formData.ReturnType;
      if (prevType !== value) {
        setGridRows((rows) =>
          rows.map((row) =>
            !row.ReturnCondition || row.ReturnCondition === prevType
              ? { ...row, ReturnCondition: value }
              : row
          )
        );
      }
      return {
        ...prev,
        formData: {
          ...prev.formData,
          ReturnType: value,
          F_ReturnStatus: value,
        },
      };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!state.formData.ReturnNo?.trim()) {
      alert("Please enter Return No");
      returnNoRef.current?.focus();
      return;
    }

    if (!state.formData.F_VendorMaster) {
      alert("Please select Party");
      vendorRef.current?.focus();
      return;
    }

    const errors: string[] = [];
    for (let i = 0; i < gridRows.length; i += 1) {
      const row = gridRows[i];
      const qty = parseFloat(row.Qty);
      const requiresColor = await getItemColorApply(row.F_ItemMaster);
      const hasColor = requiresColor ? !!row.F_ColorMaster : true;

      if (
        !row.F_ItemGroupMaster ||
        !row.F_ItemMaster ||
        !hasColor ||
        !row.ReturnCondition ||
        Number.isNaN(qty) ||
        qty <= 0
      ) {
        const missing: string[] = [];
        if (!row.F_ItemGroupMaster) missing.push("Item Group");
        if (!row.F_ItemMaster) missing.push("Item");
        if (!row.ReturnCondition) missing.push("Return Type");
        if (!hasColor) missing.push("Color");
        if (Number.isNaN(qty) || qty <= 0) missing.push("Quantity");
        errors.push(`Row ${i + 1}: ${missing.join(", ")}`);
      }
    }

    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    try {
      const ensuredReturnNo = await ensureReturnNumber(state.formData.ReturnNo);
      const formData = new FormData();
      const purchaseMasterId = Number(state.formData.F_PurchaseMasterH) || 0;
      const statusMasterId = Number(state.formData.F_StatusMaster) || 0;
      const mappedReturnStatus =
        RETURN_STATUS_MAP[state.formData.F_ReturnStatus as keyof typeof RETURN_STATUS_MAP] ??
        RETURN_STATUS_MAP[state.formData.ReturnType as keyof typeof RETURN_STATUS_MAP];
      const returnStatusId =
        mappedReturnStatus != null ? mappedReturnStatus : Number(state.formData.F_ReturnStatus) || 0;

      formData.append("F_PurchaseMasterH", String(purchaseMasterId));
      formData.append("PRNo", ensuredReturnNo || "");
      formData.append("PRDate", state.formData.ReturnDate);
      formData.append("F_VendorMaster", state.formData.F_VendorMaster || "0");
      formData.append("F_StatusMaster", String(statusMasterId));
      formData.append("F_ReturnStatus", String(returnStatusId));
      formData.append("ReturnType", state.formData.ReturnType || "Fresh");
      formData.append("Remarks", state.formData.Remarks || "");

      const rowStrings = await Promise.all(
        gridRows.map(async (row) => {
          const requiresColor = await getItemColorApply(row.F_ItemMaster);
          const colorId = requiresColor ? row.F_ColorMaster || "" : state.DefaultColor?.Id || "";
          const barcodeId = row.BarCodeId ?? "";
          return [
            row.F_ItemGroupMaster || "0",
            row.F_ItemMaster || "0",
            row.Qty || "0",
            colorId || "0",
            row.ItemCode || "",
            row.F_PurchaseMasterL || "0",
            barcodeId,
          ].join("~");
        })
      );

      formData.append("StrPurchaseReturnL", `${rowStrings.join("#")}#`);

      const totalQty = gridRows.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0);
      formData.append("TotalQty", String(totalQty));

      const response = await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: state.formData.F_PurchaseReturn || 0, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "#"
      );

      const updatedReturns = await Fn_FillListData(
        dispatch,
        setState,
        "CreatedPurchaseReturns",
        API_URL_CREATED
      );

      let nextRecordId = response?.id;
      if (!nextRecordId) {
        nextRecordId = state.formData.F_PurchaseReturn || getLastCreatedPurchaseReturnId(updatedReturns);
      }

      if (nextRecordId) {
        await loadPurchaseReturnRecord(nextRecordId);
      } else {
        await handleReset();
      }
    } catch (error) {
      console.error("Error saving purchase return", error);
    }
  }, [dispatch, ensureReturnNumber, getItemColorApply, gridRows, handleReset, navigate, state]);

  const handleDelete = useCallback(async () => {
    if (!state.formData.F_PurchaseReturn) {
      alert("Please select a purchase return to delete");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this Purchase Return?");
    if (!confirmed) return;

    try {
      await Fn_DeleteData(
        dispatch,
        state.formData.F_PurchaseReturn,
        API_URL_DELETE,
        `${API_URL_DELETE}/0`
      );
      await Fn_FillListData(dispatch, setState, "CreatedPurchaseReturns", API_URL_CREATED);
      handleReset();
    } catch (error) {
      console.error("Error deleting purchase return", error);
    }
  }, [dispatch, handleReset, state.formData.F_PurchaseReturn]);

  const handlePrint = useCallback(async () => {
    let purchaseReturnId = state.formData.F_PurchaseReturn;
    if (!purchaseReturnId) {
      purchaseReturnId = await selectLastPurchaseReturnRecord();
    }

    if (!purchaseReturnId) {
      alert("Please select a Purchase Return to print");
      return;
    }

    setSelectedPurchaseReturn(purchaseReturnId);

    const printUrl = `/print?orderType=PurchaseReturn&orderId=${encodeURIComponent(
      purchaseReturnId
    )}&returnType=${state.formData.ReturnType}`;
    const newTab = window.open(printUrl, "_blank", "noopener,noreferrer");
    if (!newTab) {
      alert("Please allow pop-ups to view the print preview.");
    }
  }, [selectLastPurchaseReturnRecord, state.formData.ReturnType, state.formData.F_PurchaseReturn]);

  const totalQuantity = gridRows.reduce(
    (sum, row) => sum + (parseInt(row.Qty, 10) || 0),
    0
  );

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      const isSave = (e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S");
      const isReset = (e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R");
      const isDelete = (e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D");
      const isPrint = (e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P");

      if (isSave) {
        e.preventDefault();
        handleSubmit();
      }

      if (isReset) {
        e.preventDefault();
        handleReset();
      }

      if (isDelete && state.isEditMode) {
        e.preventDefault();
        handleDelete();
      }

      if (isPrint) {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [handleDelete, handlePrint, handleReset, handleSubmit, state.isEditMode]);

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Purchase Return" parent="Inventory" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Purchase Return Form" tagClass="card-title mb-0" />
              <CardBody>
                <Row className="mb-3">
                  <Col md="3" className="mb-3">
                    <label className="form-label">Select Purchase Return</label>
                    <select
                      className="form-control"
                      name="F_PurchaseReturn"
                      value={state.formData.F_PurchaseReturn}
                      onChange={(e) => {
                        const id = e.target.value;
                        setState((prev) => ({
                          ...prev,
                          formData: {
                            ...prev.formData,
                            F_PurchaseReturn: id,
                          },
                        }));
                        handleCreatedReturnChange(id);
                      }}
                    >
                      <option value="">Select Purchase Return</option>
                      {state.CreatedPurchaseReturns?.map((ret) => (
                        <option key={ret.Id} value={String(ret.Id)}>
                          {ret.ReturnNo || ret.Name || ret.Id}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md="3" className="mb-3">
                    <label className="form-label">Return No <span className="text-danger">*</span></label>
                    <input
                      ref={returnNoRef}
                      className="form-control"
                      type="text"
                      value={state.formData.ReturnNo}
                      disabled={state.isEditMode}
                      onKeyDown={(e) => handleFormKeyDown(e, "ReturnNo")}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, ReturnNo: e.target.value },
                        }))
                      }
                      placeholder="Auto-generated or enter"
                    />
                  </Col>

                  <Col md="3" className="mb-3">
                    <label className="form-label">Return Date <span className="text-danger">*</span></label>
                    <input
                      ref={returnDateRef}
                      type="date"
                      className="form-control"
                      value={state.formData.ReturnDate}
                      onKeyDown={(e) => handleFormKeyDown(e, "ReturnDate")}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, ReturnDate: e.target.value },
                        }))
                      }
                      disabled={state.isEditMode}
                    />
                  </Col>

                  <Col md="3" className="mb-3">
                    <label className="form-label">Party <span className="text-danger">*</span></label>
                    <select
                      ref={vendorRef}
                      className="form-control"
                      value={state.formData.F_VendorMaster}
                      onKeyDown={(e) => handleFormKeyDown(e, "F_VendorMaster")}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, F_VendorMaster: e.target.value },
                        }))
                      }
                    >
                      <option value="">Select Party</option>
                      {state.VendorMaster?.map((vendor) => (
                        <option key={vendor.Id} value={vendor.Id}>
                          {vendor.Name}
                          {vendor.CityName ? ` - ${vendor.CityName}` : ""}
                        </option>
                      ))}
                    </select>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md="3" className="mb-3">
                    <label className="form-label">Return Type</label>
                    <select
                      ref={returnTypeRef}
                      className="form-control"
                      value={state.formData.ReturnType}
                      onKeyDown={(e) => handleFormKeyDown(e, "ReturnType")}
                      onChange={(e) => handleReturnTypeChange(e.target.value)}
                    >
                      {RETURN_CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md="9" className="mb-3">
                    <label className="form-label">Remarks</label>
                    <input
                      ref={remarksRef}
                      className="form-control"
                      value={state.formData.Remarks}
                      onKeyDown={(e) => handleFormKeyDown(e, "Remarks")}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, Remarks: e.target.value },
                        }))
                      }
                      placeholder="Enter remarks"
                    />
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <Card>
              <CardHeaderCommon title="Purchase Return Items" tagClass="card-title mb-0" />
              <CardBody>
                <GridSystemPurchaseReturn
                  gridRows={gridRows}
                  itemGroupMaster={state.ItemGroupMaster}
                  colorMaster={state.ColorMaster}
                  onAddRow={addRow}
                  onRemoveRow={removeRow}
                  onUpdateRow={updateGridRow}
                  disabled={state.isEditMode}
                  defaultColor={state.DefaultColor}
                  itemColorApplyMap={state.itemColorApplyMap}
                />
                
                <Row className="mt-3">
                  <Col lg="12" className="text-end">
                    <strong>Total Quantity: {gridRows.reduce((sum, row) => sum + (parseInt(row.Qty, 10) || 0), 0)}</strong>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="py-2">
                <div className="d-flex justify-content-end gap-2 flex-wrap">
                  {state.isEditMode && (
                    <Btn
                      type="button"
                      color="warning"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          isEditMode: false,
                        }))
                      }
                      className="me-2"
                    >
                      <i className="fa fa-edit me-1"></i> Edit
                    </Btn>
                  )}

                  {state.isEditMode && (
                    <Btn
                      type="button"
                      color="danger"
                      onClick={handleDelete}
                      className="me-2"
                    >
                      <i className="fa fa-trash me-1"></i> Delete
                    </Btn>
                  )}

                  <Btn
                    type="submit"
                    color="primary"
                    onClick={handleSubmit}
                    className="me-2"
                  >
                    <i className="fa fa-save me-1"></i> Save
                  </Btn>

                  <Btn
                    type="button"
                    color="secondary"
                    onClick={handleReset}
                    className="me-2"
                  >
                    <i className="fa fa-refresh me-1"></i> Reset
                  </Btn>

                  <Btn
                    type="button"
                    color="info"
                    onClick={handlePrint}
                    className="me-2"
                  >
                    <i className="fa fa-print me-1"></i> Print
                  </Btn>

                  <Btn
                    type="button"
                    color="light"
                    onClick={handleCancel}
                  >
                    <i className="fa fa-times me-1"></i> Cancel
                  </Btn>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PurchaseReturn;
