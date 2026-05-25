import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Container } from "reactstrap";
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
interface ItemPhoto { file: File; preview: string; }

interface ItemRow {
  id: string;
  photos: (ItemPhoto | null)[];
  videoFile: File | null;
  videoName: string;
  length: string;
  width: string;
  height: string;
  weight: string;
  price: string;
  barcode: string;
  stock: string;
}

interface ItemSection {
  id: string;
  itemName: string;
  hasSize: string; // "Yes" or "No"
  category: string;
  hsnCode: string;
  gstGroup: string;
  unit: string;
  alterUnit: string;
  unitConversion: string;
  rows: ItemRow[];
}

/* ───── Helpers ───── */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const makeRow = (): ItemRow => ({
  id: uid(), photos: [null, null, null, null, null],
  videoFile: null, videoName: "", length: "", width: "", height: "", weight: "", price: "", barcode: "", stock: "0",
});

const makeSection = (): ItemSection => ({
  id: uid(),
  itemName: "",
  hasSize: "Yes",
  category: "",
  hsnCode: "",
  gstGroup: "",
  unit: "",
  alterUnit: "",
  unitConversion: "",
  rows: [makeRow()]
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
  const [state, setState] = useState<{ gstGroups: any[], units: any[], alterUnits: any[], isProgress: boolean }>({
    gstGroups: [],
    units: [],
    alterUnits: [],
    isProgress: true,
  });

  /* Sections / rows */
  const [sections, setSections] = useState<ItemSection[]>([]);

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
      "alterUnits",
      "Masters/0/token/AlterUnitMaster/Id/0"
    ).catch((error) => {
      console.error("Failed to load Alter Units:", error);
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
      
      if (filesMap) {
        Object.entries(filesMap).forEach(([key, file]) => formData.append(key, file));
      }
      
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
      } catch (e) {
        console.error("handleFieldUpdate Error", e);
      }
    };

    if (immediate) execute();
    else timersRef.current[timerKey] = setTimeout(execute, 600);
  }, [dispatch]);

  /* ── Load pre-filled data ── */
  const loadData = useCallback(() => {
    Fn_FillListData(dispatch, (prev: any) => (typeof prev === "function" ? prev : prev), "items", ITEM_MASTER_DATA_URL)
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

             return {
                id: String(item.Id || uid()),
                itemName: item.ItemName || "",
                hasSize: item.HasSize ? "Yes" : "No",
                category: item.F_CategoryMaster ? String(item.F_CategoryMaster) : "",
                hsnCode: item.HSNCode || "",
                gstGroup: item.F_GSTGroupMaster ? String(item.F_GSTGroupMaster) : "",
                unit: item.F_UnitMaster ? String(item.F_UnitMaster) : "",
                alterUnit: item.F_AlterUnitMaster ? String(item.F_AlterUnitMaster) : "",
                unitConversion: item.UnitConversion ? String(item.UnitConversion) : "",
                rows: parsedDesignDetails.map((d: any) => ({
                    id: String(d.Id || uid()),
                    photos: [
                        d.DesignPhoto ? { file: null, preview: d.DesignPhoto } : null,
                        d.DesignPhoto2 ? { file: null, preview: d.DesignPhoto2 } : null,
                        d.DesignPhoto3 ? { file: null, preview: d.DesignPhoto3 } : null,
                        d.DesignPhoto4 ? { file: null, preview: d.DesignPhoto4 } : null,
                        d.DesignPhoto5 ? { file: null, preview: d.DesignPhoto5 } : null,
                    ],
                    videoFile: null,
                    videoName: d.VideoLink || "",
                    length: d.Length || "",
                    width: d.Width || "",
                    height: d.Height || "",
                    weight: d.Weight || "",
                    price: d.SalePrice ? String(d.SalePrice) : "",
                    barcode: d.Barcode || "",
                    stock: d.OpeningStock ? String(d.OpeningStock) : "0"
                }))
             };
          });
          setSections(prefilledSections);
          const stateId = location.state?.Id;
          if (stateId && stateId !== 0) {
            setTimeout(() => {
              const el = document.getElementById(`item-section-${stateId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                const originalBg = el.style.backgroundColor;
                el.style.backgroundColor = "#fff3cd";
                setTimeout(() => {
                  el.style.backgroundColor = originalBg;
                }, 2000);
              }
            }, 500);
          }
        } else {
          setSections([]);
        }
      })
      .catch(() => {
        setSections([]);
      });
  }, [dispatch, location.state?.Id]);

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

  const updateRow = useCallback((secIdx: number, rowIdx: number, patch: Partial<ItemRow>) => {
    setSections(prev => {
      const updated = prev.map((s, si) =>
        si !== secIdx ? s : { ...s, rows: s.rows.map((r, ri) => ri !== rowIdx ? r : { ...r, ...patch }) }
      );
      return updated;
    });
  }, []);

  const addRowToSection = useCallback(async (secIdx: number) => {
    const itemId = sections[secIdx].id;
    const newRowId = await fetchNewId(`${API_WEB_URLS.MASTER}/0/token/NewItemDesignCreate/Id/${itemId}`);
    setSections(prev => {
      const updated = prev.map((s, si) =>
        si !== secIdx ? s : { ...s, rows: [...s.rows, { ...makeRow(), id: newRowId }] }
      );
      return updated;
    });
    toast.success("Row added!", { autoClose: 1200, className: "im-toast" });
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
        Fn_DeleteData(dispatch, () => {}, Number(rowId), `${API_WEB_URLS.MASTER}/0/token/ItemDesignMaster`)
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
        Fn_DeleteData(dispatch, () => {}, Number(sectionId), `${API_WEB_URLS.MASTER}/0/token/ItemMaster`)
          .finally(() => loadData());
      }

      const updated = prev.filter((_, si) => si !== secIdx);
      return updated;
    });
  }, [dispatch, loadData]);

  const addNewItemSection = useCallback(async (secIdx?: number) => {
    const newId = await fetchNewId(`${API_WEB_URLS.MASTER}/0/token/NewItemCreate/Id/0`);
    const newRowId = await fetchNewId(`${API_WEB_URLS.MASTER}/0/token/NewItemDesignCreate/Id/${newId}`);
    
    setSections(prev => {
      const copy = [...prev];
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
    toast.success("New Item block created below!", { autoClose: 1500, className: "im-toast" });
    
    // Auto focus the newly added item's Name input
    setTimeout(() => {
      const inputs = tableRef.current?.querySelectorAll<HTMLInputElement>('.im-item-name-input');
      if (inputs && inputs.length > 0) {
        const targetIndex = typeof secIdx === "number" ? secIdx + 1 : inputs.length - 1;
        const targetInput = inputs[targetIndex] as HTMLInputElement;
        targetInput?.focus();
      }
    }, 100);
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



  /* ── Global row counter ── */
  let globalRow = 0;

  /* ────── RENDER ────── */
  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Item Master" parent="Masters" />
      <Container fluid>
        <div className="item-master-page">

          {/* ===== Compact Title Bar ===== */}
          <div className="im-title-bar">
            <h2>
              <span className="im-icon">📦</span>
              Inventory Item Creator
            </h2>
            <div className="im-status-badge">
              <span className="im-status-dot" /> Multi-Item & Variant Sheet Ready
            </div>
          </div>

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
                  <th style={{ width: 110 }}>Price</th>
                  <th style={{ width: 200 }}>Barcode</th>
                  <th style={{ width: 110 }}>Stock</th>
                  <th style={{ width: 200 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
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
                          <td colSpan={11} className="text-start">
                            <div className="im-section-info-grid">
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
                                <label>HasSize <span className="req">*</span></label>
                                <select
                                  value={section.hasSize}
                                  onChange={e => {
                                    updateSectionField(secIdx, 'hasSize', e.target.value);
                                    handleFieldUpdate(section.id, "ItemMaster", "HasSize", e.target.value === "Yes" ? "true" : "false", undefined, true);
                                  }}
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
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
                                <label>Alter Unit</label>
                                <select
                                  className="im-category-select"
                                  value={section.alterUnit}
                                  onChange={e => {
                                    updateSectionField(secIdx, 'alterUnit', e.target.value);
                                    handleFieldUpdate(section.id, "ItemMaster", "F_AlterUnitMaster", e.target.value, undefined, true);
                                  }}
                                >
                                  <option value="">Select Alter Unit</option>
                                  {(state.alterUnits || []).map((a: any, i: number) => (
                                    <option key={i} value={a.Id}>
                                      {a.AlterUnitName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="im-section-info-field">
                                <label>Unit Conversion</label>
                                <input
                                  type="text"
                                  className="im-cell-input"
                                  placeholder="e.g. 10"
                                  value={section.unitConversion}
                                  onChange={e => {
                                    updateSectionField(secIdx, 'unitConversion', e.target.value);
                                    handleFieldUpdate(section.id, "ItemMaster", "UnitConversion", e.target.value);
                                  }}
                                />
                              </div>
                              <div className="im-section-info-field" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flex: 1 }}>
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
                        {section.rows.map((row, rowIdx) => {
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
                                          <img src={photo.preview} alt={`ph${pIdx}`} />
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
    </div>
  );
};

export default AddEdit_ItemMaster;
