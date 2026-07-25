import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Barcode from "react-barcode";
import { toast } from "react-toastify";
import { Card, CardBody, CardFooter, Col, Container, Row, Input, Label, FormGroup } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_AddEditData, Fn_DisplayData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { getCurrentUserId } from "../../utils/formUtils";

interface Element {
  id: string;
  type: "text" | "barcode" | "logo" | "line";
  value: string;
  x: number; // mm
  y: number; // mm
  w: number; // mm
  h: number; // mm
  fontSize: number; // 1-5 for text font
  fontWeight: "normal" | "bold";
  rotation: 0 | 90 | 180 | 270;
  alignment: 1 | 2 | 3; // 1=left, 2=center, 3=right
  barcodeScale: number; // narrow bar width
  showText: boolean; // show human readable barcode text
  logoType?: "hallmark" | "diamond" | "ring" | "tag" | "box";
}

interface FormValues {
  Name: string;
}

interface BarcodeTemplateState {
  id: number;
  formData: Partial<FormValues>;
  isProgress?: boolean;
}

const API_URL_SAVE = `Masters/0/token/BarcodeTemplateMaster`;
const API_URL_EDIT = API_WEB_URLS.MASTER + `/0/token/BarcodeTemplateMaster/Id`;

const PX_PER_MM = 3.5;

// SVG Icons
const HallmarkIcon = () => (
  <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
    <polygon points="50,10 90,80 10,80" fill="none" stroke="#e11d48" strokeWidth="6" />
    <circle cx="50" cy="55" r="16" fill="none" stroke="#e11d48" strokeWidth="6" />
    <text x="50" y="59" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#e11d48" fontFamily="sans-serif">916</text>
  </svg>
);

const DiamondIcon = () => (
  <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
    <polygon points="50,15 80,45 50,85 20,45" fill="none" stroke="#0ea5e9" strokeWidth="6" />
    <line x1="20" y1="45" x2="80" y2="45" stroke="#0ea5e9" strokeWidth="4" />
    <line x1="50" y1="15" x2="50" y2="85" stroke="#0ea5e9" strokeWidth="4" />
  </svg>
);

const RingIcon = () => (
  <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
    <circle cx="50" cy="60" r="25" fill="none" stroke="#d97706" strokeWidth="6" />
    <polygon points="50,20 62,35 50,50 38,35" fill="#d97706" />
  </svg>
);

const TagIcon = () => (
  <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
    <path d="M20,20 L60,20 L80,50 L40,80 L20,80 Z" fill="none" stroke="#4f46e5" strokeWidth="6" />
    <circle cx="35" cy="35" r="6" fill="#4f46e5" />
  </svg>
);

const BoxIcon = () => (
  <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
    <rect x="20" y="25" width="60" height="50" rx="5" fill="none" stroke="#16a34a" strokeWidth="6" />
    <line x1="20" y1="50" x2="80" y2="50" stroke="#16a34a" strokeWidth="4" />
    <line x1="50" y1="25" x2="50" y2="75" stroke="#16a34a" strokeWidth="4" />
  </svg>
);

const AddEdit_BarcodeTemplate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [templateState, setTemplateState] = useState<BarcodeTemplateState>({
    id: 0,
    formData: {},
    isProgress: false,
  });

  // Template states
  const [name, setName] = useState("Double Column (70x15mm)");
  const [labelW, setLabelW] = useState(70);
  const [labelH, setLabelH] = useState(15);
  const [columns, setColumns] = useState(2);
  const [colGap, setColGap] = useState(2);
  const [rowGap, setRowGap] = useState(2);
  const [marginT, setMarginT] = useState(1);
  const [marginL, setMarginL] = useState(1);
  const [elements, setElements] = useState<Element[]>([
    { id: "d70_1", type: "text", value: "{{FirmName}}", x: 1, y: 0.8, w: 33, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1, showText: true },
    { id: "d70_2", type: "barcode", value: "{{Barcode}}", x: 1.5, y: 4.0, w: 32, h: 6.5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
    { id: "d70_3", type: "text", value: "MRP: ₹{{SalePrice}}", x: 1, y: 11.2, w: 33, h: 2.8, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1, showText: true }
  ]);
  const [selectedElementId, setSelectedElementId] = useState<string>("");

  // Dragging states
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elementX: 0, elementY: 0 });

  const singleLabelW = labelW / columns;
  const singleWpx = singleLabelW * PX_PER_MM;
  const hPx = labelH * PX_PER_MM;

  // Load template details when editing
  useEffect(() => {
    const locationState = location.state as { Id?: number } | undefined;
    const recordId = locationState?.Id ?? 0;

    if (recordId > 0) {
      setTemplateState((prev) => ({
        ...prev,
        id: recordId,
      }));
      Fn_DisplayData(dispatch, setTemplateState, recordId, API_URL_EDIT);
    }
  }, [dispatch, location.state]);

  // Map parsed JSON Name column back to states
  useEffect(() => {
    if (templateState.formData.Name) {
      try {
        const data = JSON.parse(templateState.formData.Name);
        setName(data.name || "");
        setLabelW(data.labelW || 100);
        setLabelH(data.labelH || 25);
        setColumns(data.columns || 2);
        setColGap(data.colGap || 2);
        setRowGap(data.rowGap || 2);
        setMarginT(data.marginT || 1.5);
        setMarginL(data.marginL || 2);
        setElements(data.elements || []);
      } catch (e) {
        console.error("Failed to parse template layout:", e);
      }
    }
  }, [templateState.formData.Name]);

  // Handle visual dragging
  const handleMouseDown = (e: React.MouseEvent, elId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElementId(elId);
    setDraggingId(elId);
    const el = elements.find((item) => item.id === elId);
    if (el) {
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elementX: el.x,
        elementY: el.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId) return;
      const deltaX = (e.clientX - dragStartRef.current.mouseX) / PX_PER_MM;
      const deltaY = (e.clientY - dragStartRef.current.mouseY) / PX_PER_MM;
      
      const newX = Math.max(0, Math.min(singleLabelW, Math.round((dragStartRef.current.elementX + deltaX) * 2) / 2));
      const newY = Math.max(0, Math.min(labelH, Math.round((dragStartRef.current.elementY + deltaY) * 2) / 2));

      setElements((prev) =>
        prev.map((el) => (el.id === draggingId ? { ...el, x: newX, y: newY } : el))
      );
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingId, singleLabelW, labelH]);

  const handleAddElement = (type: "text" | "barcode" | "logo" | "line") => {
    const newEl: Element = {
      id: `el_${Date.now()}`,
      type,
      value: type === "text" ? "New Text" : type === "barcode" ? "{{Barcode}}" : "",
      x: 5,
      y: 5,
      w: type === "barcode" ? 30 : type === "line" ? 40 : type === "logo" ? 10 : 25,
      h: type === "barcode" ? 8 : type === "line" ? 1 : type === "logo" ? 10 : 4,
      fontSize: 2,
      fontWeight: "normal",
      rotation: 0,
      alignment: 1,
      barcodeScale: 1.3,
      showText: true,
      logoType: type === "logo" ? "hallmark" : undefined,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElementId("");
  };

  const handleUpdateElement = (updated: Element) => {
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
  };

  const handleSave = async (overrideData?: any) => {
    const dataToSave = overrideData || {
      name,
      labelW,
      labelH,
      columns,
      colGap,
      rowGap,
      marginT,
      marginL,
      elements,
    };

    if (!dataToSave.name || !dataToSave.name.trim()) {
      toast.error("Template Name is required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Id", String(templateState.id ?? 0));
      formData.append("Name", JSON.stringify(dataToSave));
      formData.append("UserId", getCurrentUserId());
      formData.append(
        "F_CompanyMaster",
        (() => {
          try {
            const a = JSON.parse(localStorage.getItem("authUser") || "{}");
            return String(a?.F_CompanyMaster ?? a?.CompanyId ?? a?.F_Company ?? "0");
          } catch (e) {
            return "0";
          }
        })()
      );

      await Fn_AddEditData(
        dispatch,
        () => {},
        { arguList: { id: templateState.id, formData } },
        API_URL_SAVE,
        true,
        "template",
        navigate,
        "/barcodeTemplate"
      );
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleAutoSave70x15 = () => {
    const preset70x15 = {
      name: "Double Column (70x15mm)",
      labelW: 70,
      labelH: 15,
      columns: 2,
      colGap: 2,
      rowGap: 2,
      marginT: 1,
      marginL: 1,
      elements: [
        { id: "d70_1", type: "text", value: "{{FirmName}}", x: 1, y: 0.8, w: 33, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1, showText: true },
        { id: "d70_2", type: "barcode", value: "{{Barcode}}", x: 1.5, y: 4.0, w: 32, h: 6.5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
        { id: "d70_3", type: "text", value: "MRP: ₹{{SalePrice}}", x: 1, y: 11.2, w: 33, h: 2.8, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1, showText: true }
      ]
    };
    setName(preset70x15.name);
    setLabelW(preset70x15.labelW);
    setLabelH(preset70x15.labelH);
    setColumns(preset70x15.columns);
    setColGap(preset70x15.colGap);
    setRowGap(preset70x15.rowGap);
    setMarginT(preset70x15.marginT);
    setMarginL(preset70x15.marginL);
    setElements(preset70x15.elements as Element[]);

    handleSave(preset70x15);
  };

  const selEl = elements.find((el) => el.id === selectedElementId);

  const getElementStyle = (el: Element): React.CSSProperties => {
    const isSel = selectedElementId === el.id;
    return {
      position: "absolute",
      left: `${el.x * PX_PER_MM}px`,
      top: `${el.y * PX_PER_MM}px`,
      width: `${el.w * PX_PER_MM}px`,
      height: `${el.h * PX_PER_MM}px`,
      transform: `rotate(${el.rotation || 0}deg)`,
      transformOrigin: "top left",
      fontSize: el.type === "text" ? `${(el.fontSize || 2) * 5}px` : "12px",
      fontWeight: el.fontWeight || "normal",
      border: isSel ? "2px solid #0d6efd" : "1px dashed #cbd5e1",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: el.alignment === 2 ? "center" : el.alignment === 3 ? "flex-end" : "flex-start",
      justifyContent: "center",
      cursor: "move",
      overflow: "hidden",
      whiteSpace: "nowrap",
      userSelect: "none",
      background: isSel ? "rgba(13,110,253,0.05)" : "transparent",
      color: "#212529",
      lineHeight: 1,
    };
  };

  // Preset Layout Templates mapping
  const loadPreset = (presetId: string) => {
    let preset: Partial<typeof labelW & any> = {};
    if (presetId === "double_70x15") {
      setName("Double Column (70x15mm)");
      preset = {
        labelW: 70, labelH: 15, columns: 2, colGap: 2, rowGap: 2, marginT: 1, marginL: 1,
        elements: [
          { id: "d70_1", type: "text", value: "{{FirmName}}", x: 1, y: 0.8, w: 33, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1, showText: true },
          { id: "d70_2", type: "barcode", value: "{{Barcode}}", x: 1.5, y: 4.0, w: 32, h: 6.5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
          { id: "d70_3", type: "text", value: "MRP: ₹{{SalePrice}}", x: 1, y: 11.2, w: 33, h: 2.8, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1, showText: true }
        ]
      };
    } else if (presetId === "std_double") {
      setName("Standard Double Column (50x25mm)");
      preset = {
        labelW: 102, labelH: 25, columns: 2, colGap: 2, rowGap: 2, marginT: 1.5, marginL: 2,
        elements: [
          { id: "1", type: "text", value: "{{FirmName}}", x: 2, y: 1.5, w: 46, h: 4, fontSize: 3, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true },
          { id: "2", type: "text", value: "{{ItemName}}", x: 2, y: 6, w: 46, h: 4, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.5, showText: true },
          { id: "3", type: "barcode", value: "{{Barcode}}", x: 6, y: 10.5, w: 38, h: 8, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.3, showText: true },
          { id: "4", type: "text", value: "MRP: ₹{{SalePrice}}", x: 2, y: 20.5, w: 46, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true }
        ]
      };
    } else if (presetId === "std_single") {
      setName("Standard Single Column (50x25mm)");
      preset = {
        labelW: 50, labelH: 25, columns: 1, colGap: 0, rowGap: 2, marginT: 1.5, marginL: 2,
        elements: [
          { id: "1", type: "text", value: "{{FirmName}}", x: 2, y: 1.5, w: 46, h: 4, fontSize: 3, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true },
          { id: "2", type: "text", value: "{{ItemName}}", x: 2, y: 6, w: 46, h: 4, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.5, showText: true },
          { id: "3", type: "barcode", value: "{{Barcode}}", x: 6, y: 10.5, w: 38, h: 8, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.3, showText: true },
          { id: "4", type: "text", value: "MRP: ₹{{SalePrice}}", x: 2, y: 20.5, w: 46, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true }
        ]
      };
    } else if (presetId === "std_triple") {
      setName("Standard Triple Column (33x25mm)");
      preset = {
        labelW: 105, labelH: 25, columns: 3, colGap: 2, rowGap: 2, marginT: 1.5, marginL: 1.5,
        elements: [
          { id: "t1", type: "text", value: "{{FirmName}}", x: 1, y: 1.5, w: 31, h: 4, fontSize: 1, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
          { id: "t2", type: "text", value: "{{ItemName}}", x: 1, y: 6, w: 31, h: 4, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 0.9, showText: true },
          { id: "t3", type: "barcode", value: "{{Barcode}}", x: 2, y: 10.5, w: 29, h: 8, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
          { id: "t4", type: "text", value: "MRP: ₹{{SalePrice}}", x: 1, y: 20.5, w: 31, h: 3, fontSize: 1, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true }
        ]
      };
    } else if (presetId === "jewelry") {
      setName("Jewelry dumbbell Tag (76x25mm)");
      preset = {
        labelW: 76, labelH: 25, columns: 1, colGap: 0, rowGap: 3, marginT: 2, marginL: 2,
        elements: [
          { id: "j1", type: "text", value: "{{FirmName}}", x: 2, y: 2, w: 30, h: 4, fontSize: 3, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.2, showText: true },
          { id: "j2", type: "barcode", value: "{{Barcode}}", x: 2, y: 7, w: 30, h: 10, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.1, showText: true },
          { id: "j3", type: "text", value: "{{ItemName}}", x: 2, y: 19, w: 30, h: 4, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.2, showText: true },
          { id: "j4", type: "text", value: "MRP: ₹{{SalePrice}}", x: 44, y: 4, w: 30, h: 5, fontSize: 3, fontWeight: "bold", rotation: 180, alignment: 2, barcodeScale: 1.2, showText: true },
          { id: "j5", type: "text", value: "Size: {{SizeName}}", x: 44, y: 14, w: 30, h: 4, fontSize: 2, fontWeight: "normal", rotation: 180, alignment: 2, barcodeScale: 1.2, showText: true }
        ]
      };
    } else if (presetId === "jewelry_small") {
      setName("Small Jewelry Dumbbell Tag (50x12mm)");
      preset = {
        labelW: 50, labelH: 12, columns: 1, colGap: 0, rowGap: 2, marginT: 1, marginL: 1,
        elements: [
          { id: "js1", type: "barcode", value: "{{Barcode}}", x: 1, y: 2, w: 19, h: 5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.8, showText: false },
          { id: "js2", type: "text", value: "{{ItemName}}", x: 1, y: 7.5, w: 19, h: 3, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 0.8, showText: true },
          { id: "js3", type: "text", value: "₹{{SalePrice}}", x: 30, y: 2, w: 19, h: 4, fontSize: 1, fontWeight: "bold", rotation: 180, alignment: 2, barcodeScale: 0.8, showText: true },
          { id: "js4", type: "text", value: "S:{{SizeName}}", x: 30, y: 7, w: 19, h: 3, fontSize: 1, fontWeight: "normal", rotation: 180, alignment: 2, barcodeScale: 0.8, showText: true }
        ]
      };
    } else if (presetId === "apparel") {
      setName("Apparel Price Tag (50x75mm)");
      preset = {
        labelW: 50, labelH: 75, columns: 1, colGap: 0, rowGap: 3, marginT: 3, marginL: 3,
        elements: [
          { id: "ap1", type: "text", value: "{{FirmName}}", x: 5, y: 3, w: 40, h: 6, fontSize: 4, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true },
          { id: "ap2", type: "text", value: "{{ItemName}}", x: 5, y: 11, w: 40, h: 5, fontSize: 3, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true },
          { id: "ap3", type: "text", value: "Size: {{SizeName}}", x: 5, y: 18, w: 40, h: 4, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.5, showText: true },
          { id: "ap4", type: "text", value: "HSN: {{HSNCode}}", x: 5, y: 23, w: 40, h: 4, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.5, showText: true },
          { id: "ap5", type: "line", value: "", x: 5, y: 29, w: 40, h: 1, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.5, showText: true },
          { id: "ap6", type: "barcode", value: "{{Barcode}}", x: 5, y: 33, w: 40, h: 18, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true },
          { id: "ap7", type: "line", value: "", x: 5, y: 54, w: 40, h: 1, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.5, showText: true },
          { id: "ap8", type: "text", value: "MRP: ₹{{SalePrice}}", x: 5, y: 58, w: 40, h: 6, fontSize: 4, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true },
          { id: "ap9", type: "text", value: "THANK YOU FOR SHOPPING", x: 5, y: 66, w: 40, h: 4, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true }
        ]
      };
    } else if (presetId === "warehouse") {
      setName("Warehouse Logistics Label (100x100mm)");
      preset = {
        labelW: 100, labelH: 100, columns: 1, colGap: 0, rowGap: 4, marginT: 4, marginL: 4,
        elements: [
          { id: "wh1", type: "text", value: "LOGISTICS / STORAGE LABEL", x: 5, y: 5, w: 90, h: 6, fontSize: 4, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 2, showText: true },
          { id: "wh2", type: "line", value: "", x: 5, y: 13, w: 90, h: 2, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 2, showText: true },
          { id: "wh3", type: "text", value: "{{ItemName}}", x: 5, y: 18, w: 90, h: 8, fontSize: 4, fontWeight: "bold", rotation: 0, alignment: 1, barcodeScale: 2, showText: true },
          { id: "wh4", type: "text", value: "VARIANT: {{SizeName}}", x: 5, y: 28, w: 90, h: 6, fontSize: 3, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 2, showText: true },
          { id: "wh5", type: "text", value: "HSN CODE: {{HSNCode}}", x: 5, y: 36, w: 90, h: 6, fontSize: 3, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 2, showText: true },
          { id: "wh6", type: "barcode", value: "{{Barcode}}", x: 10, y: 45, w: 80, h: 32, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 2, showText: true },
          { id: "wh7", type: "line", value: "", x: 5, y: 80, w: 90, h: 2, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 2, showText: true },
          { id: "wh8", type: "text", value: "MRP: ₹{{SalePrice}}", x: 5, y: 85, w: 90, h: 8, fontSize: 5, fontWeight: "bold", rotation: 0, alignment: 1, barcodeScale: 2, showText: true }
        ]
      };
    }

    setLabelW(preset.labelW);
    setLabelH(preset.labelH);
    setColumns(preset.columns);
    setColGap(preset.colGap);
    setRowGap(preset.rowGap);
    setMarginT(preset.marginT);
    setMarginL(preset.marginL);
    setElements(preset.elements);
    toast.info("Preset loaded. You can now drag and customize details.");
  };

  return (
    <>
      <div className="page-body">
        <Container fluid>
          <Breadcrumbs mainTitle="Custom Barcode Template Builder" parent="Masters" />
        <Row>
          <Col sm="12">
            <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <CardHeaderCommon title={templateState.id > 0 ? "Edit Barcode Template" : "Create Barcode Template"} tagClass="card-title mb-0" />
              <CardBody className="p-4">
                <Row className="mb-4">
                  <Col md="4">
                    <FormGroup>
                      <Label className="fw-bold small">Template Name</Label>
                      <Input type="text" placeholder="e.g. Jewelrydumbbell Tag or Box Sticker" value={name} onChange={(e) => setName(e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label className="fw-bold small">Load Starting Preset Layout</Label>
                      <select className="form-select border-primary" onChange={(e) => loadPreset(e.target.value)} defaultValue="">
                        <option value="" disabled>-- Select Preset --</option>
                        <option value="double_70x15">Double Column (70x15mm) - 2 Cols</option>
                        <option value="std_double">Standard Double Column (50x25mm)</option>
                        <option value="std_single">Standard Single Column (50x25mm)</option>
                        <option value="std_triple">Standard Triple Column (33x25mm)</option>
                        <option value="jewelry">Jewelry dumbbell Tag (76x25mm)</option>
                        <option value="jewelry_small">Small Jewelry Dumbbell Tag (50x12mm)</option>
                        <option value="apparel">Apparel Price Tag (50x75mm)</option>
                        <option value="warehouse">Warehouse Logistics Label (100x100mm)</option>
                      </select>
                    </FormGroup>
                  </Col>
                  <Col md="4" className="d-flex align-items-end mb-3">
                    <Btn color="success" className="w-100 fw-bold" onClick={handleAutoSave70x15}>
                      <i className="fa fa-magic me-1" /> Auto Save 70x15mm Template
                    </Btn>
                  </Col>
                </Row>

                <Row>
                  {/* Left Column: Properties and toolbox */}
                  <Col lg="5">
                    {/* Size setup */}
                    <div className="card p-3 mb-3 bg-light border border-secondary-subtle" style={{ borderRadius: 8 }}>
                      <strong className="d-block mb-3 small text-primary"><i className="fa fa-arrows me-1" />Sticker Setup (Dimensions in mm)</strong>
                      <Row className="g-2 mb-2">
                        <Col xs="6">
                          <Label className="small mb-0 text-black fw-bold">Total Page Width (mm):</Label>
                          <Input type="number" className="form-control-sm" value={labelW} onChange={(e) => setLabelW(parseFloat(e.target.value) || 10)} />
                        </Col>
                        <Col xs="6">
                          <Label className="small mb-0 text-black fw-bold">Sticker Height (mm):</Label>
                          <Input type="number" className="form-control-sm" value={labelH} onChange={(e) => setLabelH(parseFloat(e.target.value) || 10)} />
                        </Col>
                      </Row>
                      <Row className="g-2">
                        <Col xs="4">
                          <Label className="small mb-0 text-black fw-bold">Columns:</Label>
                          <select className="form-select form-select-sm" value={columns} onChange={(e) => setColumns(parseInt(e.target.value) || 1)}>
                            <option value={1}>1 Col</option>
                            <option value={2}>2 Cols</option>
                            <option value={3}>3 Cols</option>
                          </select>
                        </Col>
                        <Col xs="4">
                          <Label className="small mb-0 text-black fw-bold">Col Gap (mm):</Label>
                          <Input type="number" className="form-control-sm" value={colGap} disabled={columns === 1} onChange={(e) => setColGap(parseFloat(e.target.value) || 0)} />
                        </Col>
                        <Col xs="4">
                          <Label className="small mb-0 text-black fw-bold">Row Gap (mm):</Label>
                          <Input type="number" className="form-control-sm" value={rowGap} onChange={(e) => setRowGap(parseFloat(e.target.value) || 0)} />
                        </Col>
                      </Row>
                    </div>

                    {/* Tool box */}
                    <div className="card p-3 mb-3 bg-light border border-secondary-subtle" style={{ borderRadius: 8 }}>
                      <strong className="d-block mb-2 small text-primary"><i className="fa fa-cubes me-1" />Add Layout Elements</strong>
                      <div className="d-flex gap-2">
                        <Btn color="dark" className="btn-sm flex-fill" onClick={() => handleAddElement("text")}><i className="fa fa-font me-1" />Text</Btn>
                        <Btn color="dark" className="btn-sm flex-fill" onClick={() => handleAddElement("barcode")}><i className="fa fa-barcode me-1" />Barcode</Btn>
                        <Btn color="dark" className="btn-sm flex-fill" onClick={() => handleAddElement("logo")}><i className="fa fa-certificate me-1" />Logo/Icon</Btn>
                        <Btn color="dark" className="btn-sm flex-fill" onClick={() => handleAddElement("line")}><i className="fa fa-minus me-1" />Line</Btn>
                      </div>
                    </div>

                    {/* Properties editor */}
                    {selEl ? (
                      <div className="card p-3 border border-primary bg-white shadow-sm" style={{ borderRadius: 8 }}>
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                          <strong className="text-primary small fw-bold">Properties: {selEl.type.toUpperCase()}</strong>
                          <Btn color="danger" className="btn-xs py-0 px-2" onClick={() => handleDeleteElement(selEl.id)}><i className="fa fa-times me-1" />Delete</Btn>
                        </div>

                        <Row className="g-2 mb-2">
                          <Col xs="6">
                            <Label className="small mb-0">Position X (mm):</Label>
                            <Input type="number" step="0.5" className="form-control-sm" value={selEl.x} onChange={(e) => handleUpdateElement({ ...selEl, x: parseFloat(e.target.value) || 0 })} />
                          </Col>
                          <Col xs="6">
                            <Label className="small mb-0">Position Y (mm):</Label>
                            <Input type="number" step="0.5" className="form-control-sm" value={selEl.y} onChange={(e) => handleUpdateElement({ ...selEl, y: parseFloat(e.target.value) || 0 })} />
                          </Col>
                        </Row>

                        <Row className="g-2 mb-2">
                          <Col xs="6">
                            <Label className="small mb-0">Width (mm):</Label>
                            <Input type="number" step="0.5" className="form-control-sm" value={selEl.w} onChange={(e) => handleUpdateElement({ ...selEl, w: parseFloat(e.target.value) || 1 })} />
                          </Col>
                          <Col xs="6">
                            <Label className="small mb-0">Height (mm):</Label>
                            <Input type="number" step="0.5" className="form-control-sm" value={selEl.h} onChange={(e) => handleUpdateElement({ ...selEl, h: parseFloat(e.target.value) || 1 })} />
                          </Col>
                        </Row>

                        <Row className="g-2 mb-2">
                          <Col xs="6">
                            <Label className="small mb-0">Rotation:</Label>
                            <select className="form-select form-select-sm" value={selEl.rotation} onChange={(e) => handleUpdateElement({ ...selEl, rotation: parseInt(e.target.value) as any })}>
                              <option value={0}>0°</option>
                              <option value={90}>90°</option>
                              <option value={180}>180°</option>
                              <option value={270}>270°</option>
                            </select>
                          </Col>
                          <Col xs="6">
                            {selEl.type === "text" ? (
                              <>
                                <Label className="small mb-0">Alignment:</Label>
                                <select className="form-select form-select-sm" value={selEl.alignment} onChange={(e) => handleUpdateElement({ ...selEl, alignment: parseInt(e.target.value) as any })}>
                                  <option value={1}>Left</option>
                                  <option value={2}>Center</option>
                                  <option value={3}>Right</option>
                                </select>
                              </>
                            ) : selEl.type === "barcode" ? (
                              <>
                                <Label className="small mb-0">Bar Width (Scale):</Label>
                                <Input type="number" step="0.1" min="0.5" max="3" className="form-control-sm" value={selEl.barcodeScale} onChange={(e) => handleUpdateElement({ ...selEl, barcodeScale: parseFloat(e.target.value) || 1 })} />
                              </>
                            ) : selEl.type === "logo" ? (
                              <>
                                <Label className="small mb-0">Logo Type:</Label>
                                <select className="form-select form-select-sm" value={selEl.logoType} onChange={(e) => handleUpdateElement({ ...selEl, logoType: e.target.value as any })}>
                                  <option value="hallmark">Hallmark 916</option>
                                  <option value="diamond">Diamond Symbol</option>
                                  <option value="ring">Ring Icon</option>
                                  <option value="tag">Tag Icon</option>
                                  <option value="box">Box Icon</option>
                                </select>
                              </>
                            ) : null}
                          </Col>
                        </Row>

                        {selEl.type === "text" && (
                          <Row className="g-2 mb-2">
                            <Col xs="6">
                              <Label className="small mb-0">Font Index (1-5):</Label>
                              <select className="form-select form-select-sm" value={selEl.fontSize} onChange={(e) => handleUpdateElement({ ...selEl, fontSize: parseInt(e.target.value) || 2 })}>
                                <option value={1}>1 (Micro)</option>
                                <option value={2}>2 (Small)</option>
                                <option value={3}>3 (Normal)</option>
                                <option value={4}>4 (Medium)</option>
                                <option value={5}>5 (Large)</option>
                              </select>
                            </Col>
                            <Col xs="6" className="pt-3">
                              <label className="form-check-label small"><input type="checkbox" className="form-check-input me-1" checked={selEl.fontWeight === "bold"} onChange={(e) => handleUpdateElement({ ...selEl, fontWeight: e.target.checked ? "bold" : "normal" })} />Bold Text</label>
                            </Col>
                          </Row>
                        )}

                        {selEl.type === "barcode" && (
                          <div className="mb-2">
                            <label className="form-check-label small"><input type="checkbox" className="form-check-input me-1" checked={selEl.showText} onChange={(e) => handleUpdateElement({ ...selEl, showText: e.target.checked })} />Show Barcode Text</label>
                          </div>
                        )}

                        {selEl.type !== "line" && selEl.type !== "logo" && (
                          <div className="mb-1">
                            <Label className="small mb-0">Text Value / Data Tag Expression:</Label>
                            <Input type="text" className="form-control-sm" value={selEl.value} onChange={(e) => handleUpdateElement({ ...selEl, value: e.target.value })} />
                            {/* Inserters */}
                            <div className="mt-1 d-flex flex-wrap gap-1">
                              <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{FirmName}}" })}>+ Firm</span>
                              <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{ItemName}}" })}>+ ItemName</span>
                              <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{SalePrice}}" })}>+ Price</span>
                              <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{Barcode}}" })}>+ Barcode</span>
                              <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{SizeName}}" })}>+ Size</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 border rounded border-dashed text-muted bg-light">
                        <i className="fa fa-info-circle fa-lg mb-2" />
                        <p className="small mb-0">Click &amp; drag elements on the canvas to visually design. Click an element to view properties here.</p>
                      </div>
                    )}
                  </Col>

                  {/* Right Column: Live drag-and-drop workspace */}
                  <Col lg="7" className="d-flex flex-column align-items-center justify-content-center p-4 border rounded bg-dark border-secondary position-relative" style={{ minHeight: 460 }}>
                    <span className="badge bg-light text-dark mb-3"><i className="fa fa-hand-pointer-o me-1" />Drag &amp; Drop Design Workspace</span>
                    
                    {(() => {
                      const isJewelry = name.toLowerCase().includes("dumbbell") || name.toLowerCase().includes("jewelry");
                      const isApparel = (name.toLowerCase().includes("apparel") || name.toLowerCase().includes("hang")) && labelH > 40;
                      
                      const canvasStyle: React.CSSProperties = isJewelry ? {
                        width: `${singleWpx}px`,
                        height: `${hPx}px`,
                        position: "relative",
                        background: "transparent",
                        border: "none",
                        boxShadow: "none"
                      } : {
                        width: `${singleWpx}px`,
                        height: `${hPx}px`,
                        background: "#fff",
                        border: "3px dashed #0d6efd",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.5)",
                        borderRadius: isApparel ? "12px" : "0px"
                      };

                      const getDumbbellDimensions = (w: number, h: number) => {
                        let tailL = w * 0.2; // default 20%
                        const nameLower = (name || "").toLowerCase();
                        
                        if (w === 76 && h === 25) tailL = 8;
                        else if (w === 50 && h === 12) tailL = 8;
                        else if (w === 80 && h === 20) tailL = 20;
                        else if (w === 81 && h === 12) tailL = 27;
                        else if (w === 100 && h === 13) {
                          tailL = nameLower.includes("35") ? 35 : 45;
                        } else if (w === 100 && h === 15) {
                          tailL = nameLower.includes("30") ? 30 : 45;
                        }
                        
                        const leftBound = (w - tailL) / 2;
                        const rightBound = leftBound + tailL;
                        
                        // Tail height (centered)
                        let tailH = Math.max(3, h * 0.25);
                        if (w === 76 && h === 25) tailH = 6;
                        if (w === 50 && h === 12) tailH = 3;
                        if (w === 80 && h === 20) tailH = 4;
                        if (w === 81 && h === 12) tailH = 3.5;
                        if (w === 100 && h === 13) tailH = 4;
                        if (w === 100 && h === 15) tailH = 4.5;
                        
                        const tailY = (h - tailH) / 2;
                        
                        // Right flap height (centered)
                        let rightH = h;
                        if (w === 80 && h === 20) rightH = 10; // asymmetrical
                        
                        const rightY = (h - rightH) / 2;
                        
                        return { leftBound, rightBound, tailL, tailH, tailY, rightH, rightY };
                      };

                      return (
                        <div style={canvasStyle} onClick={() => setSelectedElementId("")}>
                          {/* Jewelry Dumbbell realistic backing card flaps */}
                          {isJewelry && (() => {
                            const { leftBound, rightBound, tailL, tailH, tailY, rightH, rightY } = getDumbbellDimensions(labelW, labelH);
                            return (
                              <>
                                {/* Left Flap */}
                                <div style={{ position: "absolute", left: 0, top: 0, width: `${leftBound * PX_PER_MM}px`, height: `${labelH * PX_PER_MM}px`, background: "#fff", border: "1.5px solid #cbd5e1", borderRight: "none", borderRadius: "6px 0 0 6px", boxShadow: "-4px 4px 8px rgba(0,0,0,0.15)", pointerEvents: "none" }} />
                                {/* Tail */}
                                <div style={{ position: "absolute", left: `${leftBound * PX_PER_MM}px`, top: `${tailY * PX_PER_MM}px`, width: `${tailL * PX_PER_MM}px`, height: `${tailH * PX_PER_MM}px`, background: "#f8fafc", borderTop: "1.5px solid #cbd5e1", borderBottom: "1.5px solid #cbd5e1", pointerEvents: "none" }} />
                                {/* Right Flap */}
                                <div style={{ position: "absolute", left: `${rightBound * PX_PER_MM}px`, top: `${rightY * PX_PER_MM}px`, width: `${(labelW - rightBound) * PX_PER_MM}px`, height: `${rightH * PX_PER_MM}px`, background: "#fff", border: "1.5px solid #cbd5e1", borderLeft: "none", borderRadius: "0 6px 6px 0", boxShadow: "4px 4px 8px rgba(0,0,0,0.15)", pointerEvents: "none" }} />
                              </>
                            );
                          })()}

                          {/* Apparel card thread hole */}
                          {isApparel && (
                            <div style={{ position: "absolute", left: `${(labelW / 2 - 2) * PX_PER_MM}px`, top: `${4 * PX_PER_MM}px`, width: `${4 * PX_PER_MM}px`, height: `${4 * PX_PER_MM}px`, backgroundColor: "#212529", borderRadius: "50%", border: "1.5px solid #cbd5e1", pointerEvents: "none", zIndex: 10 }} />
                          )}

                      {/* Elements */}
                      {elements.map((el) => {
                        const isSel = selectedElementId === el.id;
                        
                        let displayValue = el.value || "";
                        // Replace placeholders with mock values for designer view
                        displayValue = displayValue.replace(/\{\{FirmName\}\}/g, "MY STORE");
                        displayValue = displayValue.replace(/\{\{ItemName\}\}/g, "GOLD DIAMOND RING");
                        displayValue = displayValue.replace(/\{\{SalePrice\}\}/g, "49999");
                        displayValue = displayValue.replace(/\{\{Barcode\}\}/g, "89012345");
                        displayValue = displayValue.replace(/\{\{SizeName\}\}/g, "12");

                        if (el.type === "text") {
                          return (
                            <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el.id)} style={getElementStyle(el)}>
                              {displayValue}
                            </div>
                          );
                        } else if (el.type === "barcode") {
                          return (
                            <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el.id)} style={getElementStyle(el)}>
                              <Barcode value={displayValue} height={Math.max(el.h * PX_PER_MM - 12, 10)} width={Math.max((el.w * PX_PER_MM) / 100 * el.barcodeScale, 0.5)} displayValue={el.showText} fontSize={8} margin={0} background="transparent" />
                            </div>
                          );
                        } else if (el.type === "logo") {
                          return (
                            <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el.id)} style={getElementStyle(el)}>
                              {el.logoType === "hallmark" && <HallmarkIcon />}
                              {el.logoType === "diamond" && <DiamondIcon />}
                              {el.logoType === "ring" && <RingIcon />}
                              {el.logoType === "tag" && <TagIcon />}
                              {el.logoType === "box" && <BoxIcon />}
                            </div>
                          );
                        } else if (el.type === "line") {
                          return (
                            <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el.id)} style={{
                              position: "absolute",
                              left: `${el.x * PX_PER_MM}px`,
                              top: `${el.y * PX_PER_MM}px`,
                              width: `${el.w * PX_PER_MM}px`,
                              height: `${el.h * PX_PER_MM}px`,
                              backgroundColor: "#000",
                              cursor: "move",
                              border: isSel ? "2px solid #0d6efd" : "none",
                              boxSizing: "border-box"
                            }} />
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })()}

                    <p className="text-white-50 small mt-3 text-center mb-0">
                      Label Size: {Math.round(singleLabelW * 10) / 10}mm × {labelH}mm. Elements snap to 0.5mm.
                    </p>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter className="d-flex justify-content-end gap-2 border-top">
                <Btn color="secondary" className="px-4 fw-bold" onClick={() => navigate("/barcodeTemplate")}>Cancel</Btn>
                <Btn color="success" className="px-4 fw-bold" onClick={handleAutoSave70x15}><i className="fa fa-magic me-1" /> Auto Save 70x15mm</Btn>
                <Btn color="primary" className="px-4 fw-bold" onClick={() => handleSave()}>Save Template</Btn>
              </CardFooter>
            </Card>
          </Col>
        </Row>
        </Container>
      </div>
    </>
  );
};

export default AddEdit_BarcodeTemplate;
