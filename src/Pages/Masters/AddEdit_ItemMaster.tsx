import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Container, Modal, ModalHeader, ModalBody, ModalFooter, Button, Table } from "reactstrap";
import { toast } from "react-toastify";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import { useLocation, useNavigate } from "react-router-dom";
import { Fn_AddEditData, Fn_FillListData, Fn_DeleteData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import "./ItemMaster.css";

/* ───── API URLs ───── */
const CATEGORY_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/CategoryMaster/Id/0`;
const ITEM_MASTER_DATA_URL = `${API_WEB_URLS.MASTER}/0/token/ItemMasterData/Id/0`;

/* ───── Types ───── */
interface ItemPhoto { file: File | null; preview: string; fullUrl?: string; }

interface ItemRow {
  id: string;
  photos: (ItemPhoto | null)[];
  videoFile: File | null;
  videoName: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  unitConversion: string;
  price: string;
  purchaseRate: string;
  barcode: string;
  stock: string;
  schemes?: any[];
}

interface ItemSection {
  id: string;
  itemName: string;
  hasSize: string; // "Yes" or "No"
  category: string;
  hsnCode: string;
  gstGroup: string;
  unit: string;
  material: string;
  rows: ItemRow[];
  isMinimized?: boolean;
}

/* ───── Helpers ───── */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const makeRow = (): ItemRow => ({
  id: uid(), photos: [null, null, null, null, null],
  videoFile: null, videoName: "", length: "", width: "", height: "", weight: "", unitConversion: "", price: "", purchaseRate: "", barcode: "", stock: "0", schemes: [],
});

const makeSection = (): ItemSection => ({
  id: uid(),
  itemName: "",
  hasSize: "Yes",
  category: "",
  hsnCode: "",
  gstGroup: "",
  unit: "",
  material: "",
  rows: [makeRow()],
  isMinimized: false
});

const genBarcode = () => String(Date.now());

const stockColor = (v: number) => (v <= 0 ? "red" : v <= 5 ? "yellow" : "green");


/* ───── Component ───── */
const AddEdit_ItemMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  /* Categories from API */
  const [categories, setCategories] = useState<any[]>([]);
  const [state, setState] = useState<{ gstGroups: any[], units: any[], materials: any[], isProgress: boolean }>({
    gstGroups: [],
    units: [],
    materials: [],
    isProgress: true,
  });

  /* Sections / rows */
  const [sections, setSections] = useState<ItemSection[]>([]);

  /* Scheme Modal States */
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);
  const [activeDesignId, setActiveDesignId] = useState("");
  const [schemeRows, setSchemeRows] = useState([{ FromRange: "", ToRange: "", Rate: "" }]);

  /* Ref for focus tracking */
  const tableRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  /* ── Load categories ── */
  useEffect(() => {
    Fn_FillListData(dispatch, (prev: any) => {
      if (typeof prev === "function") return prev;
      return prev;
    }, "categories", CATEGORY_LIST_URL)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? [];
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => setCategories([]));
  }, [dispatch]);

  /* ── Load gst groups, units, alter units ── */
  useEffect(() => {
    setState(prev => ({ ...prev, isProgress: true }));
    Fn_FillListData(
      dispatch,
      setState,
      "gstGroups",
      "Masters/0/token/GSTGroupMaster/Id/0"
    ).catch((error) => {
      console.error("Failed to load GST groups:", error);
    });

    Fn_FillListData(
      dispatch,
      setState,
      "units",
      "Masters/0/token/UnitMaster/Id/0"
    ).catch((error) => {
      console.error("Failed to load Units:", error);
    });

    Fn_FillListData(
      dispatch,
      setState,
      "materials",
      "Masters/0/token/MaterialMaster/Id/0"
    ).catch((error) => {
      console.error("Failed to load Materials:", error);
    });
  }, [dispatch]);

  /* ── Focus first field on mount ── */
  useEffect(() => {
    setTimeout(() => {
      const firstInput = tableRef.current?.querySelector<HTMLElement>('input:not([type="file"])');
      firstInput?.focus();
    }, 100);
  }, []);

  /* ── API helpers ── */
  const fetchNewId = useCallback(async (endpoint: string) => {
    try {
      const res = await Fn_FillListData(dispatch, () => {}, "new_id", endpoint);
      const list = Array.isArray(res) ? res : res?.dataList ?? res?.data?.dataList ?? [];
      if (list.length > 0 && list[0].Id) return String(list[0].Id);
      if (res?.Id) return String(res.Id);
      if (res?.data?.Id) return String(res.data.Id);
      if (typeof res === "string" || typeof res === "number") return String(res);
      if (typeof res?.data === "string" || typeof res?.data === "number") return String(res.data);
    } catch (e) {
      console.error("fetchNewId Error", e);
    }
    return uid();
  }, [dispatch]);

  const handleFieldUpdate = useCallback((id: string, tableName: string, fieldName: string, fieldValue: string, filesMap?: Record<string, File>, immediate = false) => {
    if (!id || id.includes("-")) return;
    
    const timerKey = `${id}_${fieldName}`;
    if (timersRef.current[timerKey]) clearTimeout(timersRef.current[timerKey]);
    
    const execute = async () => {
      const formData = new FormData();
      formData.append("Id", id);
      formData.append("UserId", "0");
      formData.append("TableName", tableName);
      formData.append("FieldName", fieldName);
      formData.append("FieldValue", fieldValue);
      
      let isPhoto = false;
      if (filesMap) {
        Object.entries(filesMap).forEach(([key, file]) => formData.append(key, file));
        isPhoto = true;
      }
      
      const loadingMsg = isPhoto ? "Uploading photo..." : (fieldValue === "" && !isPhoto && fieldName.includes("Photo") ? "Removing photo..." : "Saving changes...");
      const successMsg = isPhoto ? "Photo uploaded!" : (fieldValue === "" && !isPhoto && fieldName.includes("Photo") ? "Photo removed!" : "Changes saved!");
      
      const toastId = toast.loading(loadingMsg, { position: "bottom-right", autoClose: false });
      
      try {
        await Fn_AddEditData(
          dispatch,
          () => undefined,
          { arguList: { id: 0, formData } },
          "UpdateItemAndItemDesignMaster/0/token",
          true, 
          "",
          () => {},
          ""
        );
        toast.update(toastId, { render: successMsg, type: "success", isLoading: false, autoClose: 1000, hideProgressBar: true });
      } catch (e) {
        console.error("handleFieldUpdate Error", e);
        toast.update(toastId, { render: "Failed to save", type: "error", isLoading: false, autoClose: 2000, hideProgressBar: true });
      }
    };

    if (immediate) execute();
    else timersRef.current[timerKey] = setTimeout(execute, 600);
  }, [dispatch]);

  /* ── Load pre-filled data ── */
  const loadData = useCallback(() => {
    const stateId = location.state?.Id;
    if (!stateId || stateId === 0 || stateId === "0") {
      const initEmpty = async () => {
        setSections([]);
      };
      initEmpty();
      return;
    }

    const fetchUrl = `${API_WEB_URLS.MASTER}/0/token/ItemMasterData/Id/${stateId}`;

    Fn_FillListData(dispatch, (prev: any) => (typeof prev === "function" ? prev : prev), "items", fetchUrl)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? [];
        if (list.length > 0) {
          const prefilledSections = list.map((item: any) => {
             let parsedDesignDetails: any[] = [];
             try {
                if (typeof item.DesignDetails === "string") {
                  parsedDesignDetails = JSON.parse(item.DesignDetails || "[]");
                } else if (Array.isArray(item.DesignDetails)) {
                  parsedDesignDetails = item.DesignDetails;
                }
             } catch (e) { console.error("Parse Error:", e); }

             if (parsedDesignDetails.length === 0) parsedDesignDetails = [{}];

             let parsedSchemeDetails: any[] = [];
             try {
                if (typeof item.SchemeDetails === "string") {
                  parsedSchemeDetails = JSON.parse(item.SchemeDetails || "[]");
                } else if (Array.isArray(item.SchemeDetails)) {
                  parsedSchemeDetails = item.SchemeDetails;
                }
             } catch (e) { console.error("Parse Error Scheme:", e); }

             return {
                id: String(item.Id || uid()),
                itemName: item.ItemName || "",
                hasSize: item.HasSize ? "Yes" : "No",
                category: item.F_CategoryMaster ? String(item.F_CategoryMaster) : "",
                hsnCode: item.HSNCode || "",
                gstGroup: item.F_GSTGroupMaster ? String(item.F_GSTGroupMaster) : "",
                unit: item.F_UnitMaster ? String(item.F_UnitMaster) : "",
                material: item.F_MaterialMaster ? String(item.F_MaterialMaster) : "",
                rows: parsedDesignDetails.map((d: any) => {
                    const rowSchemes = parsedSchemeDetails
                      .filter((s: any) => String(s.F_ItemDesignMaster) === String(d.Id))
                      .map((s: any) => ({
                         FromRange: String(s.FromRange ?? ""),
                         ToRange: String(s.ToRange ?? ""),
                         Rate: String(s.Rate ?? "")
                      }));
                      
                    return {
                    id: String(d.Id || uid()),
                    photos: [
                        d.DesignPhoto ? { file: null, preview: d.DesignPhoto_Thumb && d.DesignPhoto_Thumb.trim() !== "" ? d.DesignPhoto_Thumb : d.DesignPhoto, fullUrl: d.DesignPhoto } : null,
                        d.DesignPhoto2 ? { file: null, preview: d.DesignPhoto2_Thumb && d.DesignPhoto2_Thumb.trim() !== "" ? d.DesignPhoto2_Thumb : d.DesignPhoto2, fullUrl: d.DesignPhoto2 } : null,
                        d.DesignPhoto3 ? { file: null, preview: d.DesignPhoto3_Thumb && d.DesignPhoto3_Thumb.trim() !== "" ? d.DesignPhoto3_Thumb : d.DesignPhoto3, fullUrl: d.DesignPhoto3 } : null,
                        d.DesignPhoto4 ? { file: null, preview: d.DesignPhoto4_Thumb && d.DesignPhoto4_Thumb.trim() !== "" ? d.DesignPhoto4_Thumb : d.DesignPhoto4, fullUrl: d.DesignPhoto4 } : null,
                        d.DesignPhoto5 ? { file: null, preview: d.DesignPhoto5_Thumb && d.DesignPhoto5_Thumb.trim() !== "" ? d.DesignPhoto5_Thumb : d.DesignPhoto5, fullUrl: d.DesignPhoto5 } : null,
                    ],
                    videoFile: null,
                    videoName: d.VideoLink || "",
                    length: d.Length || "",
                    width: d.Width || "",
                    height: d.Height || "",
                    weight: d.Weight || "",
                    unitConversion: d.UnitConversion ? String(d.UnitConversion) : "",
                    price: d.SalePrice ? String(d.SalePrice) : "",
                    purchaseRate: d.PurchaseRate ? String(d.PurchaseRate) : "",
                    barcode: d.Barcode || "",
                    stock: d.OpeningStock ? String(d.OpeningStock) : "0",
                    schemes: rowSchemes
                };
              })
             };
          });
          setSections(prefilledSections);
        } else {
          setSections([]);
        }
      })
      .catch(() => {
        setSections([]);
      });
  }, [dispatch, location.state?.Id, fetchNewId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Section / Row Helpers ── */
  const updateSectionField = useCallback((secIdx: number, field: keyof Omit<ItemSection, "rows" | "id">, value: any) => {
    setSections(prev => {
      const updated = prev.map((s, si) => si !== secIdx ? s : { ...s, [field]: value });
      return updated;
    });
  }, []);

  const toggleSection = useCallback((secIdx: number) => {
    setSections(prev => {
      const copy = [...prev];
      copy[secIdx] = { ...copy[secIdx], isMinimized: !copy[secIdx].isMinimized };
      return copy;
    });
  }, []);

  const updateRow = useCallback((secIdx: number, rowIdx: number, patch: Partial<ItemRow>) => {
    setSections(prev => {
      const updated = prev.map((s, si) =>
        si !== secIdx ? s : { ...s, rows: s.rows.map((r, ri) => ri !== rowIdx ? r : { ...r, ...patch }) }
      );
      return updated;
    });
  }, []);

  const addRowToSection = useCallback(async (secIdx: number) => {
    const toastId = toast.loading("Adding row...", { position: "bottom-right" });
    try {
      const itemId = sections[secIdx].id;
      const newRowId = await fetchNewId(`${API_WEB_URLS.MASTER}/0/token/NewItemDesignCreate/Id/${itemId}`);
      setSections(prev => {
        const updated = prev.map((s, si) =>
          si !== secIdx ? s : { ...s, rows: [...s.rows, { ...makeRow(), id: newRowId }] }
        );
        return updated;
      });
      toast.update(toastId, { render: "Row added!", type: "success", isLoading: false, autoClose: 1200, className: "im-toast", hideProgressBar: true });
    } catch (e) {
      toast.update(toastId, { render: "Failed to add row", type: "error", isLoading: false, autoClose: 2000, hideProgressBar: true });
    }
  }, [sections, fetchNewId]);


  const deleteRow = useCallback((secIdx: number, rowIdx: number) => {
    if (!window.confirm("Are you sure you want to delete this row?")) return;
    
    setSections(prev => {
      const s = prev[secIdx];
      if (!s) return prev;
      if (s.rows.length <= 1) {
        toast.warn("Cannot delete last row of an item variant", { autoClose: 1500 });
        return prev;
      }
      
      const rowId = s.rows[rowIdx].id;
      if (rowId) {
        const toastId = toast.loading("Deleting row...", { position: "bottom-right" });
        Fn_DeleteData(dispatch, () => {}, Number(rowId), `${API_WEB_URLS.MASTER}/0/token/ItemDesignMaster`)
          .then(() => toast.update(toastId, { render: "Row deleted!", type: "success", isLoading: false, autoClose: 1200, hideProgressBar: true }))
          .catch(() => toast.update(toastId, { render: "Failed to delete row", type: "error", isLoading: false, autoClose: 2000, hideProgressBar: true }))
          .finally(() => loadData());
      }

      const updated = prev.map((s, si) =>
        si !== secIdx ? s : { ...s, rows: s.rows.filter((_, ri) => ri !== rowIdx) }
      );
      return updated;
    });
  }, [dispatch, loadData]);

  const deleteSection = useCallback((secIdx: number) => {
    if (!window.confirm("Are you sure you want to delete this entire item?")) return;

    setSections(prev => {
      const s = prev[secIdx];
      if (!s) return prev;

      const sectionId = s.id;
      if (sectionId) {
        const toastId = toast.loading("Deleting item...", { position: "bottom-right" });
        Fn_DeleteData(dispatch, () => {}, Number(sectionId), `${API_WEB_URLS.MASTER}/0/token/ItemMaster`)
          .then(() => toast.update(toastId, { render: "Item deleted!", type: "success", isLoading: false, autoClose: 1200, hideProgressBar: true }))
          .catch(() => toast.update(toastId, { render: "Failed to delete item", type: "error", isLoading: false, autoClose: 2000, hideProgressBar: true }))
          .finally(() => loadData());
      }

      const updated = prev.filter((_, si) => si !== secIdx);
      return updated;
    });
  }, [dispatch, loadData]);

  const addNewItemSection = useCallback(async (secIdx?: number) => {
    const toastId = toast.loading("Creating new item...", { position: "bottom-right" });
    try {
      const newId = await fetchNewId(`${API_WEB_URLS.MASTER}/0/token/NewItemCreate/Id/0`);
      const newRowId = await fetchNewId(`${API_WEB_URLS.MASTER}/0/token/NewItemDesignCreate/Id/${newId}`);
      
      setSections(prev => {
        const copy: ItemSection[] = prev.map(s => ({ ...s, isMinimized: true }));
        const newSec = makeSection();
        newSec.id = newId;
        newSec.rows[0].id = newRowId;
        if (typeof secIdx === "number") {
          copy.splice(secIdx + 1, 0, newSec);
        } else {
          copy.push(newSec);
        }
        return copy;
      });
      toast.update(toastId, { render: "New Item block created below!", type: "success", isLoading: false, autoClose: 1500, className: "im-toast", hideProgressBar: true });
      
      // Auto focus the newly added item's Name input
      setTimeout(() => {
        const inputs = tableRef.current?.querySelectorAll<HTMLInputElement>('.im-item-name-input');
        if (inputs && inputs.length > 0) {
          const targetIndex = typeof secIdx === "number" ? secIdx + 1 : inputs.length - 1;
          const targetInput = inputs[targetIndex] as HTMLInputElement;
          targetInput?.focus();
        }
      }, 100);
    } catch (e) {
      toast.update(toastId, { render: "Failed to create item", type: "error", isLoading: false, autoClose: 2000, hideProgressBar: true });
    }
  }, [fetchNewId]);

  /* ── Photo handling ── */
  const handlePhoto = useCallback((secIdx: number, rowIdx: number, slotIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 5);
    if (newFiles.length === 0) { toast.error("Only images allowed"); return; }
    
    setSections(prev => {
      const s = prev[secIdx];
      if (!s) return prev;
      
      const updated = prev.map((sec, si) =>
        si !== secIdx ? sec : {
          ...s, rows: s.rows.map((r, ri) => {
            if (ri !== rowIdx) return r;
            const photos = [...r.photos];
            
            let currentSlot = slotIdx;
            newFiles.forEach(file => {
               if (currentSlot < 5) {
                  const preview = URL.createObjectURL(file);
                  photos[currentSlot] = { file, preview };
                  
                  const fieldKey = currentSlot === 0 ? "DesignPhoto" : `DesignPhoto${currentSlot + 1}`;
                  
                  setTimeout(() => {
                    handleFieldUpdate(r.id, "ItemDesignMaster", fieldKey, "", { [fieldKey]: file }, true);
                  }, 0);
                  
                  currentSlot++;
               }
            });
            
            return { ...r, photos };
          })
        }
      );
      return updated;
    });
  }, [handleFieldUpdate]);

  const removePhoto = useCallback((secIdx: number, rowIdx: number, slotIdx: number) => {
    setSections(prev => {
      const s = prev[secIdx];
      if (!s) return prev;

      const updated = prev.map((sec, si) =>
        si !== secIdx ? sec : {
          ...s, rows: s.rows.map((r, ri) => {
            if (ri !== rowIdx) return r;
            const photos = [...r.photos];
            if (photos[slotIdx]?.preview) URL.revokeObjectURL(photos[slotIdx]!.preview);
            photos[slotIdx] = null;
            
            const fieldKey = slotIdx === 0 ? "DesignPhoto" : `DesignPhoto${slotIdx + 1}`;
            setTimeout(() => {
              handleFieldUpdate(r.id, "ItemDesignMaster", fieldKey, "", undefined, true);
            }, 0);
            
            return { ...r, photos };
          })
        }
      );
      return updated;
    });
  }, [handleFieldUpdate]);

  /* ── Video handling ── */
  // Removed file handling for video, as it's now just a URL text input.

  /* ── Barcode ── */
  const generateBarcode = useCallback((secIdx: number, rowIdx: number) => {
    const code = genBarcode();
    updateRow(secIdx, rowIdx, { barcode: code });
    setSections(prev => {
      const row = prev[secIdx].rows[rowIdx];
      handleFieldUpdate(row.id, "ItemDesignMaster", "Barcode", code, undefined, true);
      return prev;
    });
    toast.success("Barcode generated!", { autoClose: 1200, className: "im-toast" });
  }, [updateRow, handleFieldUpdate]);

  const copyBarcode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(
      () => toast.info("Barcode copied!", { autoClose: 1000 }),
      () => toast.error("Copy failed")
    );
  }, []);

  /* ── Keyboard Navigation ── */
  const handleTableKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== "Tab") return;
    const target = e.target as HTMLElement;
    if (!target.matches('input, select')) return;

    e.preventDefault();
    const container = tableRef.current;
    if (!container) return;

    const inputs = Array.from(
      container.querySelectorAll<HTMLElement>('input:not([type="file"]):not([disabled]), select:not([disabled])')
    );
    const idx = inputs.indexOf(target);
    if (idx >= 0 && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
    }
  }, []);

  /* ── Scheme Modal Handlers ── */
  const openSchemeModal = (designId: string, initialSchemes?: any[]) => {
    setActiveDesignId(designId);
    if (initialSchemes && initialSchemes.length > 0) {
      setSchemeRows(initialSchemes);
    } else {
      setSchemeRows([{ FromRange: "", ToRange: "", Rate: "" }]);
    }
    setSchemeModalOpen(true);
  };

  const closeSchemeModal = () => {
    setSchemeModalOpen(false);
    setActiveDesignId("");
  };

  const addSchemeRow = () => {
    let nextFromRange = "";
    if (schemeRows.length > 0) {
      const lastToRange = schemeRows[schemeRows.length - 1].ToRange;
      if (lastToRange && !isNaN(Number(lastToRange))) {
        nextFromRange = String(Number(lastToRange) + 1);
      }
    }
    setSchemeRows([...schemeRows, { FromRange: nextFromRange, ToRange: "", Rate: "" }]);
  };

  const removeSchemeRow = (index: number) => {
    if (schemeRows.length > 1) {
      setSchemeRows(schemeRows.filter((_, i) => i !== index));
    }
  };

  const updateSchemeRow = (index: number, field: keyof typeof schemeRows[0], value: string) => {
    const updated = [...schemeRows];
    updated[index] = { ...updated[index], [field]: value };
    setSchemeRows(updated);
  };

  const saveScheme = async () => {
    try {
      const validRows = schemeRows.filter(r => r.FromRange && r.ToRange && r.Rate);
      if (validRows.length === 0) {
        toast.error("Please enter valid scheme data.");
        return;
      }
      
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userId = authUser?.uid ?? authUser?.Id ?? "0";
      
      const formData = new FormData();
      formData.append("F_ItemDesignMaster", activeDesignId);
      formData.append("UserId", userId);
      formData.append("SchemeJson", JSON.stringify(validRows));
      
      const toastId = toast.loading("Saving scheme...", { position: "bottom-right" });
      
      await Fn_AddEditData(dispatch, () => {}, { arguList: { id: 0, formData } }, "ItemSchemeMaster/0/token", true, "", () => {}, "");
      
      setSections(prev => {
        return prev.map(s => ({
          ...s,
          rows: s.rows.map(r => r.id === activeDesignId ? { ...r, schemes: validRows } : r)
        }));
      });

      toast.update(toastId, { render: "Scheme saved successfully", type: "success", isLoading: false, autoClose: 1200, hideProgressBar: true });
      closeSchemeModal();
    } catch (error) {
      console.error("Error saving scheme:", error);
      toast.error("Failed to save scheme");
    }
  };


  /* ── Global row counter ── */
  let globalRow = 0;

  /* ────── RENDER ────── */
  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Item Master" parent="Masters" />
      <Container fluid>
        <div className="item-master-page">


          {/* ===== Table ===== */}
          <div className="im-table-wrap" ref={tableRef} onKeyDown={handleTableKeyDown}>
            <table className="im-table">
              <thead>
                <tr>
                  <th style={{ width: 45 }}>#</th>
                  <th style={{ width: 240 }}>Photo (5)</th>
                  <th style={{ width: 70 }}>Video</th>
                  <th style={{ width: 80 }}>Length</th>
                  <th style={{ width: 80 }}>Width</th>
                  <th style={{ width: 80 }}>Height</th>
                  <th style={{ width: 80 }}>Weight</th>
                  <th style={{ width: 80 }}>Unit Val</th>
                  <th style={{ width: 110 }}>P. Rate</th>
                  <th style={{ width: 110 }}>Price</th>
                  <th style={{ width: 200 }}>Barcode</th>
                  <th style={{ width: 110 }}>Stock</th>
                  <th style={{ width: 200 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={13}>
                      <div className="im-empty">
                        <div className="im-empty-icon">📋</div>
                        <h4>No items yet</h4>
                        <p>Click "+ Add Item" at the bottom to create a new item row section.</p>
                        <button type="button" className="im-btn im-btn-add-item" style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '1rem' }} onClick={() => addNewItemSection()}>
                          + Add Item
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sections.map((section, secIdx) => {
                    const hasSizeColumnPresent = section.hasSize === "Yes";
                    return (
                      <React.Fragment key={section.id}>
                        {/* Section Header Row inside the Table */}
                        <tr className="im-section-header-row" id={`item-section-${section.id}`}>
                          <td colSpan={13} className="text-start">
                            <div className="im-section-info-grid" style={{ flexWrap: section.isMinimized ? 'nowrap' : 'wrap' }}>
                              <div className="im-section-info-field">
                                <label>Item Name <span className="req">*</span></label>
                                <input
                                  type="text"
                                  className="im-item-name-input"
                                  placeholder="Enter item name..."
                                  value={section.itemName}
                                  onChange={e => {
                                    updateSectionField(secIdx, 'itemName', e.target.value);
                                    handleFieldUpdate(section.id, "ItemMaster", "ItemName", e.target.value);
                                  }}
                                />
                              </div>

                              <div className="im-section-info-field">
                                <label>Category <span className="req">*</span></label>
                                <select
                                  className="im-category-select"
                                  value={section.category}
                                  onChange={e => {
                                    updateSectionField(secIdx, 'category', e.target.value);
                                    handleFieldUpdate(section.id, "ItemMaster", "F_CategoryMaster", e.target.value, undefined, true);
                                  }}
                                >
                                  <option value="">Select category</option>
                                  {categories.map((c: any) => (
                                    <option key={c.Id} value={c.Id}>
                                      {c?.GroupName ?? c?.Name ?? c?.Id}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="im-section-info-field">
                                <label>HSN Code</label>
                                <input
                                  type="text"
                                  className="im-cell-input"
                                  placeholder="Enter HSN Code"
                                  value={section.hsnCode}
                                  onChange={e => {
                                    updateSectionField(secIdx, 'hsnCode', e.target.value);
                                    handleFieldUpdate(section.id, "ItemMaster", "HSNCode", e.target.value);
                                  }}
                                />
                              </div>
                              {/* Conditionally hide these when minimized */}
                              {!section.isMinimized && (
                                <>
                                  <div className="im-section-info-field">
                                    <label>GST Group</label>
                                      <select
                                      className="im-category-select"
                                      value={section.gstGroup}
                                      onChange={e => {
                                        updateSectionField(secIdx, 'gstGroup', e.target.value);
                                        handleFieldUpdate(section.id, "ItemMaster", "F_GSTGroupMaster", e.target.value, undefined, true);
                                      }}
                                    >
                                      <option value="">Select GST Group</option>
                                      {(state.gstGroups || []).map((g: any, i: number) => (
                                        <option key={i} value={g.Id}>
                                          {g.GSTGroupName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="im-section-info-field">
                                    <label>Unit</label>
                                    <select
                                      className="im-category-select"
                                      value={section.unit}
                                      onChange={e => {
                                        updateSectionField(secIdx, 'unit', e.target.value);
                                        handleFieldUpdate(section.id, "ItemMaster", "F_UnitMaster", e.target.value, undefined, true);
                                      }}
                                    >
                                      <option value="">Select Unit</option>
                                      {(state.units || []).map((u: any, i: number) => (
                                        <option key={i} value={u.Id}>
                                          {u.UnitName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="im-section-info-field">
                                    <label>Material Master</label>
                                    <select
                                      className="im-category-select"
                                      value={section.material}
                                      onChange={e => {
                                        updateSectionField(secIdx, 'material', e.target.value);
                                        handleFieldUpdate(section.id, "ItemMaster", "F_MaterialMaster", e.target.value, undefined, true);
                                      }}
                                    >
                                      <option value="">Select Material</option>
                                      {(state.materials || []).map((m: any, i: number) => (
                                        <option key={i} value={m.Id}>
                                          {m.MaterialName || m.Name || m.GroupName || m.materialName || `Material ${m.Id}`}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </>
                              )}
                              <div className="im-section-info-field" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flex: 1 }}>
                                <button
                                  type="button"
                                  className="im-btn"
                                  style={{ marginRight: '10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                                  title={section.isMinimized ? "Maximize Variants" : "Minimize Variants"}
                                  onClick={() => toggleSection(secIdx)}
                                >
                                  {section.isMinimized ? "🔽 Maximize" : "🔼 Minimize"}
                                </button>
                                <button
                                  type="button"
                                  className="im-btn im-btn-delete"
                                  style={{ marginRight: '10px' }}
                                  title="Delete Item"
                                  onClick={() => deleteSection(secIdx)}
                                >
                                  🗑 Delete Item
                                </button>
                                <div className="im-section-info-badge">
                                  Item #{secIdx + 1}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Variants Rows */}
                        {!section.isMinimized && section.rows.map((row, rowIdx) => {
                          globalRow++;
                          return (
                            <tr key={row.id}>
                              {/* # */}
                              <td className="im-row-num">{globalRow}</td>

                              {/* Photos */}
                              <td>
                                <div className="im-photo-grid">
                                  {row.photos.map((photo, pIdx) => (
                                    <div className="im-photo-slot" key={pIdx}>
                                      {photo ? (
                                        <>
                                          <a href={photo.fullUrl || photo.preview} target="_blank" rel="noopener noreferrer">
                                            <img src={photo.preview} alt={`ph${pIdx}`} />
                                          </a>
                                          <button
                                            type="button"
                                            className="im-photo-remove"
                                            onClick={() => removePhoto(secIdx, rowIdx, pIdx)}
                                          >×</button>
                                        </>
                                      ) : (
                                        <>
                                          <span className="im-photo-icon">🖼</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={e => handlePhoto(secIdx, rowIdx, pIdx, e.target.files)}
                                          />
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* Video */}
                              <td>
                                <input
                                  type="text"
                                  className="im-cell-input"
                                  placeholder="Video URL"
                                  value={row.videoName}
                                  onChange={e => {
                                    updateRow(secIdx, rowIdx, { videoName: e.target.value });
                                    handleFieldUpdate(row.id, "ItemDesignMaster", "VideoLink", e.target.value);
                                  }}
                                />
                              </td>

                              {/* Length */}
                              <td>
                                <input
                                  className="im-cell-input"
                                  placeholder="Len"
                                  value={row.length}
                                  onChange={e => {
                                    updateRow(secIdx, rowIdx, { length: e.target.value });
                                    handleFieldUpdate(row.id, "ItemDesignMaster", "Length", e.target.value);
                                  }}
                                />
                              </td>

                              {/* Width */}
                              <td>
                                <input
                                  className="im-cell-input"
                                  placeholder="Wid"
                                  value={row.width}
                                  onChange={e => {
                                    updateRow(secIdx, rowIdx, { width: e.target.value });
                                    handleFieldUpdate(row.id, "ItemDesignMaster", "Width", e.target.value);
                                  }}
                                />
                              </td>

                              {/* Height */}
                              <td>
                                <input
                                  className="im-cell-input"
                                  placeholder="Hgt"
                                  value={row.height}
                                  onChange={e => {
                                    updateRow(secIdx, rowIdx, { height: e.target.value });
                                    handleFieldUpdate(row.id, "ItemDesignMaster", "Height", e.target.value);
                                  }}
                                />
                              </td>

                              {/* Weight */}
                              <td>
                                <input
                                  className="im-cell-input"
                                  placeholder="Wgt"
                                  value={row.weight}
                                  onChange={e => {
                                    updateRow(secIdx, rowIdx, { weight: e.target.value });
                                    handleFieldUpdate(row.id, "ItemDesignMaster", "Weight", e.target.value);
                                  }}
                                />
                              </td>

                              {/* Unit Value */}
                              <td>
                                <input
                                  className="im-cell-input"
                                  placeholder="Unit Val"
                                  value={row.unitConversion}
                                  onChange={e => {
                                    updateRow(secIdx, rowIdx, { unitConversion: e.target.value });
                                    handleFieldUpdate(row.id, "ItemDesignMaster", "UnitConversion", e.target.value);
                                  }}
                                />
                              </td>

                              {/* Purchase Rate */}
                              <td>
                                <input
                                  className="im-cell-input im-price"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={row.purchaseRate}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === "" || Number(v) >= 0) {
                                      updateRow(secIdx, rowIdx, { purchaseRate: v });
                                      handleFieldUpdate(row.id, "ItemDesignMaster", "PurchaseRate", v);
                                    }
                                  }}
                                />
                              </td>

                              {/* Price */}
                              <td>
                                <input
                                  className="im-cell-input im-price"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={row.price}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === "" || Number(v) >= 0) {
                                      updateRow(secIdx, rowIdx, { price: v });
                                      handleFieldUpdate(row.id, "ItemDesignMaster", "SalePrice", v);
                                    }
                                  }}
                                />
                                <div style={{ marginTop: '5px', textAlign: 'center' }}>
                                  <button type="button" className="im-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#3b82f6', color: 'white' }} onClick={() => openSchemeModal(row.id, row.schemes)}>
                                    Add Scheme
                                  </button>
                                </div>
                              </td>

                              {/* Barcode */}
                              <td>
                                <div className="im-barcode-wrap">
                                  {row.barcode ? (
                                    <>
                                      <span className="im-barcode-text">{row.barcode}</span>
                                      <button type="button" className="im-btn-copy" title="Copy" onClick={() => copyBarcode(row.barcode)}>📋</button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="im-barcode-text" style={{ color: "#94a3b8" }}>—</span>
                                      <button type="button" className="im-btn-gen green" onClick={() => generateBarcode(secIdx, rowIdx)}>
                                        Generate
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>

                              {/* Stock */}
                              <td>
                                <div className="im-stock-wrap">
                                  <span className={`im-stock-dot ${stockColor(Number(row.stock) || 0)}`} />
                                  <input
                                    className="im-cell-input"
                                    type="number"
                                    min="0"
                                    value={row.stock}
                                    onChange={e => {
                                      const v = e.target.value;
                                      if (v === "" || Number(v) >= 0) {
                                        updateRow(secIdx, rowIdx, { stock: v });
                                        handleFieldUpdate(row.id, "ItemDesignMaster", "OpeningStock", v);
                                      }
                                    }}
                                    style={{ width: 70 }}
                                  />
                                </div>
                              </td>

                              {/* Actions */}
                              <td>
                                <div className="im-actions">
                                  <button type="button" className="im-btn im-btn-delete" title="Delete Row" onClick={() => deleteRow(secIdx, rowIdx)}>
                                    🗑
                                  </button>
                                  <button type="button" className="im-btn im-btn-add-row" onClick={() => addRowToSection(secIdx)}>
                                    + Add Row
                                  </button>
                                  <button type="button" className="im-btn im-btn-add-item" onClick={() => addNewItemSection(secIdx)}>
                                    + Add Item
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ===== Footer ===== */}
          <div className="im-footer">
            <span className="im-footer-note">Note: Press Enter in any input to move to the next field.</span>
            <div className="im-footer-actions">
              <button type="button" className="im-btn im-btn-add-item" onClick={() => addNewItemSection()}>
                + Add Item
              </button>
              <button type="button" className="im-btn-reset" onClick={() => window.location.reload()}>
                🔄 Refresh
              </button>
            </div>
          </div>

        </div>
      </Container>
      
      <Modal isOpen={schemeModalOpen} toggle={closeSchemeModal} size="lg">
        <ModalHeader toggle={closeSchemeModal}>Add Scheme</ModalHeader>
        <ModalBody>
          <Table bordered size="sm">
            <thead>
              <tr>
                <th>From Range</th>
                <th>To Range</th>
                <th>Rate</th>
                <th style={{ width: '100px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {schemeRows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input type="number" className="form-control form-control-sm" value={row.FromRange} onChange={(e) => updateSchemeRow(index, "FromRange", e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="form-control form-control-sm" value={row.ToRange} onChange={(e) => updateSchemeRow(index, "ToRange", e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="form-control form-control-sm" value={row.Rate} onChange={(e) => updateSchemeRow(index, "Rate", e.target.value)} />
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button color="success" size="sm" onClick={addSchemeRow}>+</Button>
                      <Button color="danger" size="sm" onClick={() => removeSchemeRow(index)} disabled={schemeRows.length === 1}>-</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={saveScheme}>Save Scheme</Button>
          <Button color="secondary" onClick={closeSchemeModal}>Cancel</Button>
        </ModalFooter>
      </Modal>

    </div>
  );
};

export default AddEdit_ItemMaster;
