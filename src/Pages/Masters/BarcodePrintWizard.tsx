import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import Barcode from "react-barcode";
import { toast } from "react-toastify";
import { API_WEB_URLS } from "../../constants/constAPI";
import { Fn_FillListData } from "../../store/Functions";

interface Variant {
  Id: number | string;
  SizeName?: string;
  SalePrice?: number | string;
  Barcode?: string;
}
interface Item {
  Id: number | string;
  ItemName: string;
  DesignDetails: Variant[] | string;
  firmName?: string;
  HSNCode?: string;
}
interface PaperSize {
  name: string; widthMm: number; heightMm: number; widthIn: number; heightIn: number;
}
interface PrinterInfo {
  paperSizes: PaperSize[]; resolutions: number[];
  defaultPaperName: string; defaultWidthMm: number; defaultHeightMm: number;
  defaultDpi: number; isLandscape: boolean;
}

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

interface Template {
  id: string;
  name: string;
  labelW: number;
  labelH: number;
  columns: number;
  colGap: number;
  rowGap: number;
  marginT: number;
  marginL: number;
  elements: Element[];
}

const AGENT = "http://127.0.0.1:9187";

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

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "std_50_25_double",
    name: "Standard Double Column (50x25mm)",
    labelW: 102,
    labelH: 25,
    columns: 2,
    colGap: 2,
    rowGap: 2,
    marginT: 1.5,
    marginL: 2,
    elements: [
      { id: "1", type: "text", value: "{{FirmName}}", x: 2, y: 1.5, w: 46, h: 4, fontSize: 3, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true },
      { id: "2", type: "text", value: "{{ItemName}}", x: 2, y: 6, w: 46, h: 4, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.5, showText: true },
      { id: "3", type: "barcode", value: "{{Barcode}}", x: 6, y: 10.5, w: 38, h: 8, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.3, showText: true },
      { id: "4", type: "text", value: "MRP: ₹{{SalePrice}}", x: 2, y: 20.5, w: 46, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true }
    ]
  },
  {
    id: "std_50_25_single",
    name: "Standard Single Column (50x25mm)",
    labelW: 50,
    labelH: 25,
    columns: 1,
    colGap: 0,
    rowGap: 2,
    marginT: 1.5,
    marginL: 2,
    elements: [
      { id: "1", type: "text", value: "{{FirmName}}", x: 2, y: 1.5, w: 46, h: 4, fontSize: 3, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true },
      { id: "2", type: "text", value: "{{ItemName}}", x: 2, y: 6, w: 46, h: 4, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.5, showText: true },
      { id: "3", type: "barcode", value: "{{Barcode}}", x: 6, y: 10.5, w: 38, h: 8, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.3, showText: true },
      { id: "4", type: "text", value: "MRP: ₹{{SalePrice}}", x: 2, y: 20.5, w: 46, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.5, showText: true }
    ]
  },
  {
    id: "std_triple",
    name: "Standard Triple Column (33x25mm)",
    labelW: 105,
    labelH: 25,
    columns: 3,
    colGap: 2,
    rowGap: 2,
    marginT: 1.5,
    marginL: 1.5,
    elements: [
      { id: "t1", type: "text", value: "{{FirmName}}", x: 1, y: 1.5, w: 31, h: 4, fontSize: 1, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
      { id: "t2", type: "text", value: "{{ItemName}}", x: 1, y: 6, w: 31, h: 4, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 0.9, showText: true },
      { id: "t3", type: "barcode", value: "{{Barcode}}", x: 2, y: 10.5, w: 29, h: 8, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
      { id: "t4", type: "text", value: "MRP: ₹{{SalePrice}}", x: 1, y: 20.5, w: 31, h: 3, fontSize: 1, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true }
    ]
  },
  {
    id: "jewelry_dumbbell",
    name: "Jewelry Dumbbell Tag (76x25mm)",
    labelW: 76,
    labelH: 25,
    columns: 1,
    colGap: 0,
    rowGap: 3,
    marginT: 2,
    marginL: 2,
    elements: [
      { id: "j1", type: "text", value: "{{FirmName}}", x: 2, y: 2, w: 30, h: 4, fontSize: 3, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.2, showText: true },
      { id: "j2", type: "barcode", value: "{{Barcode}}", x: 2, y: 7, w: 30, h: 10, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.1, showText: true },
      { id: "j3", type: "text", value: "{{ItemName}}", x: 2, y: 19, w: 30, h: 4, fontSize: 2, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.2, showText: true },
      { id: "j4", type: "text", value: "MRP: ₹{{SalePrice}}", x: 44, y: 4, w: 30, h: 5, fontSize: 3, fontWeight: "bold", rotation: 180, alignment: 2, barcodeScale: 1.2, showText: true },
      { id: "j5", type: "text", value: "Size: {{SizeName}}", x: 44, y: 14, w: 30, h: 4, fontSize: 2, fontWeight: "normal", rotation: 180, alignment: 2, barcodeScale: 1.2, showText: true }
    ]
  },
  {
    id: "jewelry_small",
    name: "Small Jewelry Dumbbell Tag (50x12mm)",
    labelW: 50,
    labelH: 12,
    columns: 1,
    colGap: 0,
    rowGap: 2,
    marginT: 1,
    marginL: 1,
    elements: [
      { id: "js1", type: "barcode", value: "{{Barcode}}", x: 1, y: 2, w: 19, h: 5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.8, showText: false },
      { id: "js2", type: "text", value: "{{ItemName}}", x: 1, y: 7.5, w: 19, h: 3, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 0.8, showText: true },
      { id: "js3", type: "text", value: "₹{{SalePrice}}", x: 30, y: 2, w: 19, h: 4, fontSize: 1, fontWeight: "bold", rotation: 180, alignment: 2, barcodeScale: 0.8, showText: true },
      { id: "js4", type: "text", value: "S:{{SizeName}}", x: 30, y: 7, w: 19, h: 3, fontSize: 1, fontWeight: "normal", rotation: 180, alignment: 2, barcodeScale: 0.8, showText: true }
    ]
  },
  {
    id: "apparel",
    name: "Apparel Price Tag (50x75mm)",
    labelW: 50,
    labelH: 75,
    columns: 1,
    colGap: 0,
    rowGap: 3,
    marginT: 3,
    marginL: 3,
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
  },
  {
    id: "warehouse",
    name: "Warehouse Logistics Label (100x100mm)",
    labelW: 100,
    labelH: 100,
    columns: 1,
    colGap: 0,
    rowGap: 4,
    marginT: 4,
    marginL: 4,
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
  },
  {
    id: "jewelry_asym",
    name: "Asymmetrical Jewelry Tag (80x20mm)",
    labelW: 80,
    labelH: 20,
    columns: 1,
    colGap: 0,
    rowGap: 3,
    marginT: 1.5,
    marginL: 2,
    elements: [
      { id: "ja1", type: "text", value: "{{FirmName}}", x: 2, y: 1.5, w: 26, h: 3.5, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.1, showText: true },
      { id: "ja2", type: "barcode", value: "{{Barcode}}", x: 2, y: 5.5, w: 26, h: 8, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 1.0, showText: true },
      { id: "ja3", type: "text", value: "{{ItemName}}", x: 2, y: 14.5, w: 26, h: 3.5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.1, showText: true },
      { id: "ja4", type: "text", value: "₹{{SalePrice}}", x: 52, y: 3, w: 26, h: 4, fontSize: 2, fontWeight: "bold", rotation: 180, alignment: 2, barcodeScale: 1.1, showText: true },
      { id: "ja5", type: "text", value: "Size: {{SizeName}}", x: 52, y: 12, w: 26, h: 4, fontSize: 1, fontWeight: "normal", rotation: 180, alignment: 2, barcodeScale: 1.1, showText: true }
    ]
  },
  {
    id: "jewelry_81_12",
    name: "Hallmark Jewelry Tag (81x12mm)",
    labelW: 81,
    labelH: 12,
    columns: 1,
    colGap: 0,
    rowGap: 2.5,
    marginT: 1,
    marginL: 1.5,
    elements: [
      { id: "h81_1", type: "text", value: "{{FirmName}}", x: 2, y: 1, w: 23, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
      { id: "h81_2", type: "barcode", value: "{{Barcode}}", x: 2, y: 4.5, w: 23, h: 5.5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.8, showText: false },
      { id: "h81_3", type: "text", value: "{{ItemName}}", x: 2, y: 10.5, w: 23, h: 3, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 0.9, showText: true },
      { id: "h81_4", type: "text", value: "₹{{SalePrice}}", x: 56, y: 1.5, w: 23, h: 3.5, fontSize: 2, fontWeight: "bold", rotation: 180, alignment: 2, barcodeScale: 0.9, showText: true },
      { id: "h81_5", type: "text", value: "S:{{SizeName}}", x: 56, y: 6.5, w: 23, h: 3, fontSize: 1, fontWeight: "normal", rotation: 180, alignment: 2, barcodeScale: 0.9, showText: true }
    ]
  },
  {
    id: "jewelry_100_13",
    name: "Hallmark Jewelry Tag (100x13mm)",
    labelW: 100,
    labelH: 13,
    columns: 1,
    colGap: 0,
    rowGap: 3,
    marginT: 1.5,
    marginL: 2,
    elements: [
      { id: "h100_13_1", type: "text", value: "{{FirmName}}", x: 2, y: 1, w: 23.5, h: 3, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: true },
      { id: "h100_13_2", type: "barcode", value: "{{Barcode}}", x: 2, y: 4.5, w: 23.5, h: 5.5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.8, showText: false },
      { id: "h100_13_3", type: "text", value: "{{ItemName}}", x: 2, y: 10.5, w: 23.5, h: 3, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 0.9, showText: true },
      { id: "h100_13_4", type: "text", value: "₹{{SalePrice}}", x: 74.5, y: 1.5, w: 23.5, h: 3.5, fontSize: 2, fontWeight: "bold", rotation: 180, alignment: 2, barcodeScale: 0.9, showText: true },
      { id: "h100_13_5", type: "text", value: "S:{{SizeName}}", x: 74.5, y: 6.5, w: 23.5, h: 3, fontSize: 1, fontWeight: "normal", rotation: 180, alignment: 2, barcodeScale: 0.9, showText: true }
    ]
  },
  {
    id: "jewelry_100_15",
    name: "Hallmark Jewelry Tag (100x15mm)",
    labelW: 100,
    labelH: 15,
    columns: 1,
    colGap: 0,
    rowGap: 3.5,
    marginT: 2,
    marginL: 2.5,
    elements: [
      { id: "h100_15_1", type: "text", value: "{{FirmName}}", x: 2, y: 1.5, w: 30, h: 4, fontSize: 2, fontWeight: "bold", rotation: 0, alignment: 2, barcodeScale: 1.0, showText: true },
      { id: "h100_15_2", type: "barcode", value: "{{Barcode}}", x: 2, y: 6, w: 30, h: 6.5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 2, barcodeScale: 0.9, showText: false },
      { id: "h100_15_3", type: "text", value: "{{ItemName}}", x: 2, y: 13, w: 30, h: 3.5, fontSize: 1, fontWeight: "normal", rotation: 0, alignment: 1, barcodeScale: 1.0, showText: true },
      { id: "h100_15_4", type: "text", value: "₹{{SalePrice}}", x: 68, y: 2, w: 30, h: 4.5, fontSize: 2, fontWeight: "bold", rotation: 180, alignment: 2, barcodeScale: 1.0, showText: true },
      { id: "h100_15_5", type: "text", value: "Size: {{SizeName}}", x: 68, y: 8, w: 30, h: 4, fontSize: 1, fontWeight: "normal", rotation: 180, alignment: 2, barcodeScale: 1.0, showText: true }
    ]
  }
];

function parseVariants(item: Item): Variant[] {
  try {
    if (typeof item.DesignDetails === "string") return JSON.parse(item.DesignDetails || "[]");
    if (Array.isArray(item.DesignDetails)) return item.DesignDetails;
  } catch { }
  return [];
}

export default function BarcodePrintWizard() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("print"); // "print", "hardware", "designer"
  const [item, setItem] = useState<Item | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Step 2 - printer
  const [agentActive, setAgentActive] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [printerName, setPrinterName] = useState(() => {
    return localStorage.getItem("barcodePrinterName") || "";
  });
  const [printerInfo, setPrinterInfo] = useState<PrinterInfo | null>(null);
  const [selectedPaper, setSelectedPaper] = useState("");
  const [dpi, setDpi] = useState(203);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Template States
  const [templates, setTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem("barcodeCustomTemplates");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_TEMPLATES;
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    return localStorage.getItem("barcodeSelectedTemplateId") || "std_50_25_double";
  });
  const [selectedElementId, setSelectedElementId] = useState<string>("");

  // Layout Dimensions (mm)
  const [labelW, setLabelW] = useState(100);
  const [labelH, setLabelH] = useState(25);
  const [marginT, setMarginT] = useState(2);
  const [marginL, setMarginL] = useState(2);
  const [columns, setColumns] = useState(2);   // labels per row
  const [colGap, setColGap] = useState(2);     // gap between columns in mm
  const [rowGap, setRowGap] = useState(2);     // gap between rows in mm
  const [elements, setElements] = useState<Element[]>([]);
  
  // Header firm name
  const [firmName, setFirmName] = useState("FIRM NAME");
  const [printing, setPrinting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Load custom templates from Database
  useEffect(() => {
    const loadDbTemplates = async () => {
      try {
        Fn_FillListData(dispatch, () => {}, "dbTemplates", "Masters/0/token/BarcodeTemplateMaster/Id/0")
          .then((data: any) => {
            let rawList: any[] = [];
            if (Array.isArray(data)) rawList = data;
            else if (data?.data?.response && Array.isArray(data.data.response)) rawList = data.data.response;
            else if (data?.response && Array.isArray(data.response)) rawList = data.response;
            else if (data?.dataList && Array.isArray(data.dataList)) rawList = data.dataList;
            else if (data?.DataList && Array.isArray(data.DataList)) rawList = data.DataList;
            else if (data?.data?.dataList && Array.isArray(data.data.dataList)) rawList = data.data.dataList;
            else if (data?.data?.DataList && Array.isArray(data.data.DataList)) rawList = data.data.DataList;

            if (Array.isArray(rawList) && rawList.length > 0) {
              const parsedList = rawList.map((item: any) => {
                try {
                  const parsed = typeof item.Name === "string" ? JSON.parse(item.Name) : (item.Name || {});
                  return { ...parsed, id: String(item.Id), dbId: item.Id };
                } catch (e) {
                  return null;
                }
              }).filter(Boolean) as Template[];
              
              setTemplates(prev => {
                const customOnly = parsedList.filter(t => !DEFAULT_TEMPLATES.some(d => d.id === t.id));
                return [...DEFAULT_TEMPLATES, ...customOnly];
              });
            }
          })
          .catch((e) => console.error("Failed to load database templates:", e));
      } catch (e) {
        console.error("Failed to load database templates:", e);
      }
    };
    loadDbTemplates();
  }, [dispatch]);

  // Load custom template details when selection changes
  useEffect(() => {
    const t = templates.find(temp => temp.id === selectedTemplateId) || templates[0];
    if (t) {
      setLabelW(t.labelW);
      setLabelH(t.labelH);
      setColumns(t.columns);
      setColGap(t.colGap);
      setRowGap(t.rowGap);
      setMarginT(t.marginT);
      setMarginL(t.marginL);
      setElements(t.elements || []);
      setSelectedElementId("");
      localStorage.setItem("barcodeSelectedTemplateId", t.id);
    }
  }, [selectedTemplateId, templates]);

  // Save current template layout changes
  useEffect(() => {
    if (!selectedTemplateId) return;
    setTemplates(prev => {
      const updated = prev.map(t => {
        if (t.id === selectedTemplateId) {
          return {
            ...t,
            labelW,
            labelH,
            columns,
            colGap,
            rowGap,
            marginT,
            marginL,
            elements
          };
        }
        return t;
      });
      localStorage.setItem("barcodeCustomTemplates", JSON.stringify(updated));
      return updated;
    });
  }, [selectedTemplateId, labelW, labelH, columns, colGap, rowGap, marginT, marginL, elements]);

  // Save printer details on change
  useEffect(() => {
    if (printerName) {
      localStorage.setItem("barcodePrinterName", printerName);
    }
  }, [printerName]);

  useEffect(() => {
    if (printerName && selectedPaper) {
      localStorage.setItem(`barcodePrinterPaper_${printerName}`, selectedPaper);
    }
  }, [printerName, selectedPaper]);

  // Save customized firm name
  useEffect(() => {
    if (firmName && firmName !== "FIRM NAME") {
      localStorage.setItem("barcodeFirmName", firmName);
    }
  }, [firmName]);

  // Force white background + black text on body for this new-tab page
  useEffect(() => {
    const prev = { color: document.body.style.color, bg: document.body.style.backgroundColor };
    document.body.style.color = "#212529";
    document.body.style.backgroundColor = "#f0f2f5";
    // Also inject a style tag to override any global CSS
    const style = document.createElement("style");
    style.id = "wiz-override";
    style.textContent = `
      body, body * { box-sizing: border-box; }
      .wiz-content, .wiz-content * { color: #212529 !important; }
      .wiz-content h1,.wiz-content h2,.wiz-content h3,.wiz-content h4,.wiz-content h5,.wiz-content h6,
      .wiz-content p,.wiz-content span,.wiz-content label,.wiz-content td,
      .wiz-content small,.wiz-content strong,.wiz-content b { color: #212529 !important; }
      .wiz-content .text-muted { color: #6c757d !important; }
      .wiz-content .text-danger { color: #dc3545 !important; }
      .wiz-content .text-success { color: #198754 !important; }
      .wiz-content .text-primary { color: #0d6efd !important; }
      .wiz-content .text-warning { color: #856404 !important; }
      .wiz-content table { color: #212529 !important; background: #fff !important; }
      .wiz-content table td { color: #212529 !important; }
      .wiz-content table thead th { color: #fff !important; }
      .wiz-content table tbody tr { background-color: #fff !important; color: #212529 !important; }
      .wiz-content .form-control { color: #212529 !important; background-color: #fff !important; }
      .wiz-content .form-select { color: #212529 !important; background-color: #fff !important; }
      .wiz-content input { color: #212529 !important; }
      .wiz-content .alert { color: #212529 !important; }
      .wiz-content .alert-success { color: #0f5132 !important; }
      .wiz-content .alert-danger { color: #842029 !important; }
      .wiz-content .btn-outline-secondary { color: #6c757d !important; }
      .wiz-content .bg-light { background-color: #f8f9fa !important; color: #212529 !important; }
      .wiz-content .bg-white { background-color: #fff !important; color: #212529 !important; }
      .wiz-content .btn-primary, .wiz-content .btn-primary * { color: #fff !important; }
      .wiz-content .btn-success, .wiz-content .btn-success * { color: #fff !important; }
      .wiz-content .btn-danger, .wiz-content .btn-danger * { color: #fff !important; }
    `;
    document.head.appendChild(style);
    return () => {
      document.body.style.color = prev.color;
      document.body.style.backgroundColor = prev.bg;
      document.getElementById("wiz-override")?.remove();
    };
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem("barcodePrintItem");
    const savedFirmName = localStorage.getItem("barcodeFirmName");
    const fn = savedFirmName || sessionStorage.getItem("barcodePrintFirmName") || "FIRM NAME";
    setFirmName(fn);
    if (!raw) { toast.error("No item data found. Please go back and try again."); return; }
    const parsed: Item = JSON.parse(raw);
    setItem(parsed);
    const v = parseVariants(parsed);
    setVariants(v);
    const initQ: Record<string, number> = {};
    const initC: Record<string, string> = {};
    const initS: Record<string, boolean> = {};
    v.forEach((d, i) => {
      const k = String(d.Id || i);
      initQ[k] = 1;
      initC[k] = "";
      initS[k] = false;
    });
    setQuantities(initQ); setCodes(initC); setSelected(initS);
    checkAgent();
  }, []);

  const checkAgent = async () => {
    try {
      const r = await fetch(`${AGENT}/ping`);
      if (r.ok) { setAgentActive(true); fetchPrinters(); }
      else setAgentActive(false);
    } catch { setAgentActive(false); }
  };

  const fetchPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const r = await fetch(`${AGENT}/printers`);
      if (r.ok) {
        const d = await r.json();
        const list: string[] = d.printers || [];
        setPrinters(list);
        const savedPrinter = localStorage.getItem("barcodePrinterName");
        const def = savedPrinter && list.includes(savedPrinter)
          ? savedPrinter
          : (d.defaultPrinter || list[0] || "");
        setPrinterName(def);
        if (def) fetchPrinterInfo(def);
      }
    } catch { }
    finally { setLoadingPrinters(false); }
  };

  const fetchPrinterInfo = async (name: string) => {
    if (!name) return;
    setLoadingInfo(true);
    setPrinterInfo(null);
    setSelectedPaper("");
    try {
      const r = await fetch(`${AGENT}/printer-info?name=${encodeURIComponent(name)}`);
      if (r.ok) {
        const d: PrinterInfo = await r.json();
        setPrinterInfo(d);
        setDpi(d.defaultDpi);
        const savedPaper = localStorage.getItem(`barcodePrinterPaper_${name}`);
        const def = (savedPaper && d.paperSizes.find(p => p.name === savedPaper))
          || d.paperSizes.find(p => p.name === d.defaultPaperName)
          || d.paperSizes[0];
        if (def) { 
          setSelectedPaper(def.name); 
          const hasSaved = !!localStorage.getItem("barcodeCustomTemplates");
          if (isFirstLoad.current && hasSaved) {
            isFirstLoad.current = false;
          } else {
            applyPaper(def, d.defaultDpi);
            isFirstLoad.current = false;
          }
        }
      }
    } catch { }
    finally { setLoadingInfo(false); }
  };

  const applyPaper = (p: PaperSize, dpiVal: number) => {
    setDpi(dpiVal);
    // Find matching template or resize current one
    const matching = templates.find(t => t.labelW === p.widthMm && t.labelH === p.heightMm);
    if (matching) {
      setSelectedTemplateId(matching.id);
    } else {
      setLabelW(p.widthMm);
      setLabelH(p.heightMm);
    }
  };

  // Build print queue
  const printQueue = variants.flatMap((d, i) => {
    const k = String(d.Id || i);
    if (!selected[k] || !d.Barcode || quantities[k] <= 0) return [];
    return Array(quantities[k]).fill({
      barcode: d.Barcode,
      itemName: item?.ItemName || "",
      sizeName: d.SizeName || "Std",
      salePrice: codes[k] || String(d.SalePrice || "0"),
      hsnCode: item?.HSNCode || ""
    });
  });

  // Calculate overflow check
  const isOverflowing = useMemo(() => {
    const singleLabelW = labelW / columns;
    return elements.some(el => {
      // Rotate 90/270 flips dimensions
      const checkW = (el.rotation === 90 || el.rotation === 270) ? el.h : el.w;
      const checkH = (el.rotation === 90 || el.rotation === 270) ? el.w : el.h;
      return el.x + checkW > singleLabelW || el.y + checkH > labelH;
    });
  }, [elements, labelW, labelH, columns]);

  // Interpolate dynamic template placeholders
  const interpolate = (val: string, label: { barcode: string; itemName: string; sizeName: string; salePrice: string; hsnCode: string }) => {
    let s = val || "";
    s = s.replace(/\{\{FirmName\}\}/g, firmName || "");
    s = s.replace(/\{\{ItemName\}\}/g, label.itemName || "");
    s = s.replace(/\{\{SalePrice\}\}/g, label.salePrice || "0.00");
    s = s.replace(/\{\{Barcode\}\}/g, label.barcode || "");
    s = s.replace(/\{\{SizeName\}\}/g, label.sizeName || "Std");
    s = s.replace(/\{\{HSNCode\}\}/g, label.hsnCode || "");
    return s;
  };

  // Interpolate sample data for live visual designer preview
  const interpolateSample = (val: string) => {
    let s = val || "";
    s = s.replace(/\{\{FirmName\}\}/g, firmName || "MY FIRM NAME");
    s = s.replace(/\{\{ItemName\}\}/g, item?.ItemName || "JEWELLERY DIAMOND RING");
    s = s.replace(/\{\{SalePrice\}\}/g, "45000");
    s = s.replace(/\{\{Barcode\}\}/g, "89012345");
    s = s.replace(/\{\{SizeName\}\}/g, "12 (16.5mm)");
    s = s.replace(/\{\{HSNCode\}\}/g, "7113");
    return s;
  };

  // Build TSPL command block matching absolute templates
  const buildTspl = () => {
    const dots = dpi === 300 ? 11.8 : 8;
    const singleLabelW = labelW / columns;
    let cmd = "";

    for (let i = 0; i < printQueue.length; i += columns) {
      const row = printQueue.slice(i, i + columns);
      cmd += `SIZE ${labelW} mm, ${labelH} mm\nGAP ${rowGap} mm, 0 mm\nDIRECTION 1\nCLS\n`;

      row.forEach((label: any, colIdx: number) => {
        const colXmm = colIdx * singleLabelW;

        elements.forEach((el) => {
          const val = interpolate(el.value, label);
          const actualXmm = colXmm + el.x;
          const actualYmm = el.y;

          const xDots = Math.round(actualXmm * dots);
          const yDots = Math.round(actualYmm * dots);

          if (el.type === "text") {
            const font = String(el.fontSize || 2);
            const rotation = el.rotation || 0;
            const align = el.alignment || 1;
            // TSPL TEXT command: TEXT x, y, "font", rotation, x_mul, y_mul, [alignment,] "content"
            if (align > 1) {
              cmd += `TEXT ${xDots}, ${yDots}, "${font}", ${rotation}, 1, 1, ${align}, "${val}"\n`;
            } else {
              cmd += `TEXT ${xDots}, ${yDots}, "${font}", ${rotation}, 1, 1, "${val}"\n`;
            }
          } else if (el.type === "barcode") {
            const bh = Math.round(el.h * dots);
            const rotation = el.rotation || 0;
            const scale = el.barcodeScale || 2;
            const showText = el.showText ? 1 : 0;
            // TSPL BARCODE command: BARCODE x, y, "128", height, human_readable, rotation, narrow_bar, wide_bar, "code"
            cmd += `BARCODE ${xDots}, ${yDots}, "128", ${bh}, ${showText}, ${rotation}, ${scale}, ${scale}, "${val}"\n`;
          } else if (el.type === "line") {
            const lwDots = Math.round(el.w * dots);
            const lhDots = Math.round(el.h * dots);
            // TSPL BAR command: BAR x, y, width, height
            cmd += `BAR ${xDots}, ${yDots}, ${lwDots}, ${lhDots}\n`;
          } else if (el.type === "logo") {
            cmd += `; LOGO: ${el.logoType || "hallmark"} at ${xDots}, ${yDots}\n`;
          }
        });
      });

      cmd += `PRINT 1\n\n`;
    }
    return cmd;
  };

  const handlePrint = async () => {
    if (!printerName) { toast.error("Please select a printer"); return; }
    if (printQueue.length === 0) { toast.warning("No labels queued"); return; }
    
    if (isOverflowing) {
      const confirmPrint = window.confirm(
        `Warning: Some barcode elements in your template exceed label width or height bounds.\n\nDo you want to print anyway?`
      );
      if (!confirmPrint) return;
    }

    const tspl = buildTspl();
    setPrinting(true);
    try {
      const r = await fetch(`${AGENT}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tspl, printerName: printerName.trim() })
      });
      const d = await r.json();
      if (r.ok && d.success) toast.success("✅ Labels sent to printer!");
      else toast.error(`Print Error: ${d.error || "Failed"}`);
    } catch { toast.error("Cannot connect to Local Print Agent. Make sure it is running."); }
    finally { setPrinting(false); }
  };

  // Canvas style positioning helper
  const PX_PER_MM = 3.2;

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
      fontSize: el.type === "text" ? `${(el.fontSize || 2) * 4.5}px` : "12px",
      fontWeight: el.fontWeight || "normal",
      border: isSel ? "1.5px solid #0d6efd" : "1px dashed #ced4da",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: el.alignment === 2 ? "center" : el.alignment === 3 ? "flex-end" : "flex-start",
      justifyContent: "center",
      cursor: "pointer",
      overflow: "hidden",
      whiteSpace: "nowrap",
      userSelect: "none",
      background: isSel ? "rgba(13,110,253,0.05)" : "transparent",
      color: "#212529",
      lineHeight: 1
    };
  };

  // ── STEP 1 UI: Select items & variant print quantities ──────────────────────────────
  const Step1 = () => (
    <div>
      <h5 className="fw-bold mb-1">Select Variants &amp; Quantities</h5>
      <p className="text-muted small mb-3">Choose which variants to print and set their quantities.</p>
      <div className="table-responsive">
        <table className="table table-bordered table-sm align-middle" style={{ color: "#212529" }}>
          <thead className="table-dark">
            <tr>
              <th style={{ width: 40 }}><input type="checkbox" onChange={e => { const s: any = {}; variants.forEach((d, i) => { if (d.Barcode) s[String(d.Id || i)] = e.target.checked; }); setSelected(s); }} /></th>
              <th>Variant / Size</th>
              <th style={{ width: 120 }}>Barcode</th>
              <th style={{ width: 150 }}>MRP / Price</th>
              <th style={{ width: 110 }}>Quantity</th>
            </tr>
          </thead>
          <tbody style={{ color: "#212529", backgroundColor: "#fff" }}>
            {variants.map((d, i) => {
              const k = String(d.Id || i);
              return (
                <tr key={k} style={{ opacity: !d.Barcode ? 0.5 : 1, color: "#212529", backgroundColor: "#fff" }}>
                  <td className="text-center" style={{ color: "#212529" }}>
                     <input type="checkbox" disabled={!d.Barcode} checked={!!selected[k]} onChange={e => setSelected(p => ({ ...p, [k]: e.target.checked }))} />
                  </td>
                  <td style={{ color: "#212529" }}><strong>{d.SizeName || `Variant ${i + 1}`}</strong></td>
                  <td style={{ color: "#212529" }}><small className="font-monospace">{d.Barcode || <span className="text-danger">No Barcode</span>}</small></td>
                  <td style={{ color: "#212529" }}>
                    <input type="text" className="form-control form-control-sm text-center" style={{ color: "#212529", backgroundColor: "#fff", maxWidth: 120 }} value={codes[k] || ""}
                      onChange={e => setCodes(p => ({ ...p, [k]: e.target.value }))} placeholder={String(d.SalePrice || "0")} />
                  </td>
                  <td style={{ color: "#212529" }}>
                    <div className="d-flex align-items-center gap-1">
                      <button className="btn btn-outline-secondary btn-sm px-2" style={{ color: "#212529" }} onClick={() => setQuantities(p => ({ ...p, [k]: Math.max(0, (p[k] || 1) - 1) }))}>-</button>
                      <input type="number" className="form-control form-control-sm text-center" style={{ width: 55, color: "#212529", backgroundColor: "#fff" }} min="0" value={quantities[k] ?? 1}
                        onChange={e => setQuantities(p => ({ ...p, [k]: Math.max(0, parseInt(e.target.value) || 0) }))} />
                      <button className="btn btn-outline-secondary btn-sm px-2" style={{ color: "#212529" }} onClick={() => setQuantities(p => ({ ...p, [k]: (p[k] || 1) + 1 }))}>+</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-light rounded border mt-2 d-flex gap-4 flex-wrap">
        <span><strong>Total Labels:</strong> {printQueue.length}</span>
        <span><strong>Variants Selected:</strong> {Object.values(selected).filter(Boolean).length}</span>
      </div>
    </div>
  );

  // ── STEP 2 UI: Printer setup ──────────────────────────────────────────────
  const Step2 = () => (
    <div>
      <h5 className="fw-bold mb-1">Select Printer &amp; Paper Size</h5>
      <p className="text-muted small mb-3">Configure printer hardware and paper layout bounds.</p>

      {/* Agent status */}
      <div className={`alert ${agentActive ? "alert-success" : "alert-danger"} py-2 d-flex align-items-center gap-2`}>
        <i className={`fa ${agentActive ? "fa-check-circle" : "fa-times-circle"}`} />
        <span>{agentActive ? "Local Print Agent is Online" : "Local Print Agent is Offline"}</span>
        <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={checkAgent}><i className="fa fa-refresh me-1" />Refresh</button>
      </div>

      {!agentActive && (
        <div className="card border-warning bg-warning bg-opacity-10 p-3 mb-3 shadow-sm" style={{ borderRadius: 10 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div style={{ flex: 1 }}>
              <strong className="text-warning-emphasis d-block mb-1" style={{ fontSize: "14.5px" }}>
                <i className="fa fa-exclamation-triangle me-2" />
                Local Companion Print Agent is Offline
              </strong>
              <small className="text-muted">
                To print barcodes directly from your browser, download the utility and run it on your Windows machine.
              </small>
            </div>
            <a href="/print-agent/LocalPrintAgent.exe" download className="btn btn-warning fw-bold text-dark px-4 py-2" style={{ boxShadow: "0 4px 10px rgba(255,193,7,0.25)" }}>
              <i className="fa fa-download me-2" />
              Download Print Agent (.exe)
            </a>
          </div>
        </div>
      )}

      {/* Printer select */}
      <div className="mb-3">
        <label className="fw-bold small mb-1 d-block">Select Printer</label>
        <div className="d-flex gap-2">
          {agentActive && printers.length > 0 ? (
            <select className="form-select" value={printerName} onChange={e => { setPrinterName(e.target.value); fetchPrinterInfo(e.target.value); }}>
              {printers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <input className="form-control" placeholder="Type printer name exactly (e.g. TVS LP 46 NEO)" value={printerName} onChange={e => setPrinterName(e.target.value)} />
          )}
          <button className="btn btn-outline-primary" disabled={!agentActive || loadingPrinters} onClick={fetchPrinters}>
            {loadingPrinters ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-print" />} Get Printers
          </button>
        </div>
      </div>

      {/* Paper sizes */}
      {loadingInfo && <div className="text-center text-muted py-3"><i className="fa fa-spinner fa-spin me-2" />Loading printer capabilities...</div>}
      {printerInfo && !loadingInfo && (
        <>
          <label className="fw-bold small mb-2 d-block"><i className="fa fa-file-o me-1 text-primary" />Select Paper / Label Size</label>
          {printerInfo.paperSizes.length === 0
            ? <p className="text-warning small">No paper sizes reported. Enter label dimensions manually in Step 3.</p>
            : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 8, maxHeight: 260, overflowY: "auto", marginBottom: 16 }}>
                {printerInfo.paperSizes.map(p => {
                  const isSel = selectedPaper === p.name;
                  return (
                    <div key={p.name} onClick={() => { setSelectedPaper(p.name); applyPaper(p, dpi); }}
                      style={{ border: isSel ? "2px solid #0d6efd" : "1.5px solid #dee2e6", borderRadius: 8, padding: "10px 8px", cursor: "pointer", textAlign: "center", background: isSel ? "#e7f1ff" : "#fff", boxShadow: isSel ? "0 0 0 3px rgba(13,110,253,0.15)" : "none", transition: "all 0.15s" }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: isSel ? "#0d6efd" : "#333", wordBreak: "break-word", marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#6c757d" }}>{p.widthIn}" × {p.heightIn}"</div>
                      <div style={{ fontSize: 10, color: "#6c757d" }}>{p.widthMm}×{p.heightMm}mm</div>
                      {isSel && <i className="fa fa-check-circle text-primary mt-1" style={{ fontSize: 14 }} />}
                    </div>
                  );
                })}
              </div>
            )}

          {/* DPI */}
          <div className="mb-3">
            <label className="fw-bold small mb-2 d-block"><i className="fa fa-tachometer me-1 text-primary" />Print Resolution</label>
            <div className="d-flex gap-2 flex-wrap">
              {printerInfo.resolutions.map(r => (
                <button key={r} className={`btn btn-sm ${dpi === r ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => { setDpi(r); const sp = printerInfo.paperSizes.find(p => p.name === selectedPaper); if (sp) applyPaper(sp, r); }}>
                  {r} DPI {r === printerInfo.defaultDpi && <small>(default)</small>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Firmware title customization */}
      <div className="border rounded p-3 bg-light mt-2">
        <label className="fw-bold small mb-2 d-block">Firm Details</label>
        <div className="d-flex align-items-center gap-2">
          <label className="small fw-bold mb-0">Firm Name:</label>
          <input className="form-control form-control-sm" style={{ maxWidth: 240 }} value={firmName} onChange={e => setFirmName(e.target.value)} />
        </div>
      </div>
    </div>
  );

  // ── STEP 3 UI: Advanced Visual Barcode Designer ───────────────────────────────────────────────────
  const Step3 = () => {
    const singleLabelW = labelW / columns;
    const singleWpx = singleLabelW * PX_PER_MM;
    const hPx = labelH * PX_PER_MM;
    const selEl = elements.find(el => el.id === selectedElementId);

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
        logoType: type === "logo" ? "hallmark" : undefined
      };
      setElements(prev => [...prev, newEl]);
      setSelectedElementId(newEl.id);
    };

    const handleDeleteElement = (id: string) => {
      setElements(prev => prev.filter(el => el.id !== id));
      setSelectedElementId("");
    };

    const handleUpdateElement = (updated: Element) => {
      setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
    };

    const handleCreateTemplate = () => {
      const name = window.prompt("Enter new template name:");
      if (!name) return;
      const newId = `custom_${Date.now()}`;
      const newTemp: Template = {
        id: newId,
        name,
        labelW,
        labelH,
        columns,
        colGap,
        rowGap,
        marginT,
        marginL,
        elements: [...elements]
      };
      setTemplates(prev => [...prev, newTemp]);
      setSelectedTemplateId(newId);
      toast.success("New template created successfully!");
    };

    const handleDeleteTemplate = () => {
      if (["std_50_25_double", "std_50_25_single", "std_triple", "jewelry_dumbbell", "jewelry_small", "apparel", "warehouse"].includes(selectedTemplateId)) {
        toast.error("Default presets cannot be deleted.");
        return;
      }
      if (window.confirm("Are you sure you want to delete this template?")) {
        const nextId = "std_50_25_double";
        setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
        setSelectedTemplateId(nextId);
        toast.success("Template deleted.");
      }
    };

    const handleExportLayout = () => {
      const activeT = templates.find(t => t.id === selectedTemplateId);
      if (activeT) {
        navigator.clipboard.writeText(JSON.stringify(activeT, null, 2));
        toast.success("Template layout JSON copied to clipboard!");
      }
    };

    const handleImportLayout = () => {
      const input = window.prompt("Paste template JSON layout string here:");
      if (!input) return;
      try {
        const imported = JSON.parse(input);
        if (imported.name && imported.elements) {
          const newId = `imported_${Date.now()}`;
          const newT: Template = { ...imported, id: newId };
          setTemplates(prev => [...prev, newT]);
          setSelectedTemplateId(newId);
          toast.success("Template layout imported successfully!");
        } else {
          toast.error("Invalid template format. Missing name or elements.");
        }
      } catch (e) {
        toast.error("Failed to parse JSON layout.");
      }
    };

    return (
      <div className="designer-tab">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0"><i className="fa fa-paint-brush text-primary me-2" />Visual Barcode Designer</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-primary" onClick={handleExportLayout}><i className="fa fa-copy me-1" />Export JSON</button>
            <button className="btn btn-sm btn-outline-info" onClick={handleImportLayout}><i className="fa fa-download me-1" />Import JSON</button>
          </div>
        </div>

        <div className="row">
          {/* Design Controls (Left Column) */}
          <div className="col-md-6">
            {/* Template Selector & General CRUD */}
            <div className="card p-3 mb-3 bg-light border">
              <label className="fw-bold small text-muted mb-1">1. Active Barcode Template</label>
              <div className="d-flex gap-2 mb-2">
                <select className="form-select text-dark fw-bold border-secondary-subtle" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.labelW}x{t.labelH}mm)</option>)}
                </select>
                <button className="btn btn-success btn-sm text-nowrap" onClick={handleCreateTemplate} title="Save current layout as a new template"><i className="fa fa-plus me-1" />Save As</button>
                <button className="btn btn-danger btn-sm text-nowrap" onClick={handleDeleteTemplate} disabled={["std_50_25_double", "std_50_25_single", "std_triple", "jewelry_dumbbell", "jewelry_small", "apparel", "warehouse"].includes(selectedTemplateId)}><i className="fa fa-trash" /></button>
              </div>
            </div>

            {/* Sticker Dimensions */}
            <div className="card p-3 mb-3 bg-light border">
              <label className="fw-bold small text-muted mb-3"><i className="fa fa-arrows me-1 text-primary" />2. Sticker Page Setup</label>
              
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="small mb-1">Page Width: <strong>{labelW} mm</strong></label>
                  <input type="number" className="form-control form-control-sm" value={labelW} onChange={e => setLabelW(Number(e.target.value) || 10)} />
                </div>
                <div className="col-6">
                  <label className="small mb-1">Sticker Height: <strong>{labelH} mm</strong></label>
                  <input type="number" className="form-control form-control-sm" value={labelH} onChange={e => setLabelH(Number(e.target.value) || 10)} />
                </div>
              </div>

              <div className="row g-2">
                <div className="col-4">
                  <label className="small mb-1">Cols per row:</label>
                  <select className="form-select form-select-sm" value={columns} onChange={e => setColumns(Number(e.target.value))}>
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                  </select>
                </div>
                <div className="col-4">
                  <label className="small mb-1">Col Gap (mm):</label>
                  <input type="number" className="form-control form-control-sm" value={colGap} disabled={columns === 1} onChange={e => setColGap(Number(e.target.value) || 0)} />
                </div>
                <div className="col-4">
                  <label className="small mb-1">Row Gap (mm):</label>
                  <input type="number" className="form-control form-control-sm" value={rowGap} onChange={e => setRowGap(Number(e.target.value) || 0)} />
                </div>
              </div>
            </div>

            {/* Elements toolbox */}
            <div className="card p-3 mb-3 bg-light border">
              <label className="fw-bold small text-muted mb-2"><i className="fa fa-cubes me-1 text-primary" />3. Add Elements</label>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-dark flex-fill" onClick={() => handleAddElement("text")}><i className="fa fa-font me-1" />Text Field</button>
                <button className="btn btn-sm btn-outline-dark flex-fill" onClick={() => handleAddElement("barcode")}><i className="fa fa-barcode me-1" />Barcode Graphic</button>
                <button className="btn btn-sm btn-outline-dark flex-fill" onClick={() => handleAddElement("logo")}><i className="fa fa-certificate me-1" />Logo/Icon</button>
              </div>
            </div>

            {/* Element Properties */}
            {selEl ? (
              <div className="card p-3 bg-white border border-primary">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <strong className="text-primary small fw-bold">Edit Element: {selEl.type.toUpperCase()}</strong>
                  <button className="btn btn-xs btn-outline-danger py-0 px-2" onClick={() => handleDeleteElement(selEl.id)}><i className="fa fa-times me-1" />Delete</button>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="small mb-0">Pos X (mm):</label>
                    <input type="number" step="0.5" className="form-control form-control-sm" value={selEl.x} onChange={e => handleUpdateElement({ ...selEl, x: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="col-6">
                    <label className="small mb-0">Pos Y (mm):</label>
                    <input type="number" step="0.5" className="form-control form-control-sm" value={selEl.y} onChange={e => handleUpdateElement({ ...selEl, y: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="small mb-0">Width (mm):</label>
                    <input type="number" step="0.5" className="form-control form-control-sm" value={selEl.w} onChange={e => handleUpdateElement({ ...selEl, w: parseFloat(e.target.value) || 1 })} />
                  </div>
                  <div className="col-6">
                    <label className="small mb-0">Height (mm):</label>
                    <input type="number" step="0.5" className="form-control form-control-sm" value={selEl.h} onChange={e => handleUpdateElement({ ...selEl, h: parseFloat(e.target.value) || 1 })} />
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="small mb-0">Rotation:</label>
                    <select className="form-select form-select-sm" value={selEl.rotation} onChange={e => handleUpdateElement({ ...selEl, rotation: parseInt(e.target.value) as any })}>
                      <option value={0}>0°</option>
                      <option value={90}>90°</option>
                      <option value={180}>180°</option>
                      <option value={270}>270°</option>
                    </select>
                  </div>
                  <div className="col-6">
                    {selEl.type === "text" ? (
                      <>
                        <label className="small mb-0">Text Alignment:</label>
                        <select className="form-select form-select-sm" value={selEl.alignment} onChange={e => handleUpdateElement({ ...selEl, alignment: parseInt(e.target.value) as any })}>
                          <option value={1}>Left</option>
                          <option value={2}>Center</option>
                          <option value={3}>Right</option>
                        </select>
                      </>
                    ) : selEl.type === "barcode" ? (
                      <>
                        <label className="small mb-0">Bar Width (Scale):</label>
                        <input type="number" step="0.1" min="0.5" max="3" className="form-control form-control-sm" value={selEl.barcodeScale} onChange={e => handleUpdateElement({ ...selEl, barcodeScale: parseFloat(e.target.value) || 1 })} />
                      </>
                    ) : selEl.type === "logo" ? (
                      <>
                        <label className="small mb-0">Logo Type:</label>
                        <select className="form-select form-select-sm" value={selEl.logoType} onChange={e => handleUpdateElement({ ...selEl, logoType: e.target.value as any })}>
                          <option value="hallmark">Hallmark 916</option>
                          <option value="diamond">Diamond Symbol</option>
                          <option value="ring">Ring Icon</option>
                          <option value="tag">Tag Icon</option>
                          <option value="box">Box Icon</option>
                        </select>
                      </>
                    ) : null}
                  </div>
                </div>

                {selEl.type === "text" && (
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="small mb-0">Font Index (1-5):</label>
                      <select className="form-select form-select-sm" value={selEl.fontSize} onChange={e => handleUpdateElement({ ...selEl, fontSize: parseInt(e.target.value) })}>
                        <option value={1}>1 (Micro)</option>
                        <option value={2}>2 (Small)</option>
                        <option value={3}>3 (Normal)</option>
                        <option value={4}>4 (Medium)</option>
                        <option value={5}>5 (Large)</option>
                      </select>
                    </div>
                    <div className="col-6 pt-3">
                      <label className="form-check-label small"><input type="checkbox" className="form-check-input me-1" checked={selEl.fontWeight === "bold"} onChange={e => handleUpdateElement({ ...selEl, fontWeight: e.target.checked ? "bold" : "normal" })} />Bold text</label>
                    </div>
                  </div>
                )}

                {selEl.type === "barcode" && (
                  <div className="mb-2">
                    <label className="form-check-label small"><input type="checkbox" className="form-check-input me-1" checked={selEl.showText} onChange={e => handleUpdateElement({ ...selEl, showText: e.target.checked })} />Show Barcode Value Text</label>
                  </div>
                )}

                {selEl.type !== "line" && selEl.type !== "logo" && (
                  <div className="mb-1">
                    <label className="small mb-0 d-block">Dynamic Content / Value Expression:</label>
                    <input type="text" className="form-control form-control-sm" value={selEl.value} onChange={e => handleUpdateElement({ ...selEl, value: e.target.value })} />
                  </div>
                )}
                
                {/* Variable inserters */}
                {selEl.type !== "line" && selEl.type !== "logo" && (
                  <div className="mt-1 d-flex flex-wrap gap-1">
                    <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{FirmName}}" })}>+ FirmName</span>
                    <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{ItemName}}" })}>+ ItemName</span>
                    <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{SalePrice}}" })}>+ SalePrice</span>
                    <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{Barcode}}" })}>+ Barcode</span>
                    <span className="badge bg-secondary cursor-pointer" style={{ cursor: "pointer" }} onClick={() => handleUpdateElement({ ...selEl, value: selEl.value + "{{SizeName}}" })}>+ SizeName</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 border rounded border-dashed text-muted bg-light">
                <i className="fa fa-info-circle fa-lg mb-2" />
                <p className="small mb-0">Click any element on the visual preview sticker (to the right) to configure its position, text, variables, and rotation details.</p>
              </div>
            )}
          </div>

          {/* Sticker Live Canvas Preview (Right Column) */}
          <div className="col-md-6 d-flex flex-column align-items-center justify-content-center p-3 border rounded bg-dark border-secondary position-relative" style={{ minHeight: 460 }}>
            <span className="badge bg-light text-dark mb-3"><i className="fa fa-eye me-1" />Interactive Label Design Canvas</span>
            
            {(() => {
              const isJewelry = selectedTemplateId === "jewelry_dumbbell" || selectedTemplateId === "jewelry_small" || selectedTemplateId === "jewelry_asym" || selectedTemplateId === "jewelry_81_12" || selectedTemplateId === "jewelry_100_13" || selectedTemplateId === "jewelry_100_15" || selectedTemplateId.toLowerCase().includes("jewelry") || selectedTemplateId.toLowerCase().includes("dumbbell");
              const isApparel = (selectedTemplateId === "apparel" || selectedTemplateId.toLowerCase().includes("apparel") || selectedTemplateId.toLowerCase().includes("hang")) && labelH > 40;
              
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
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                borderRadius: isApparel ? "12px" : "0px"
              };

              const getDumbbellDimensions = (w: number, h: number) => {
                let tailL = w * 0.2; // default 20%
                const nameLower = (selectedTemplateId || "").toLowerCase();
                
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

                  {/* Elements rendering */}
                  {elements.map(el => {
                    const isSel = selectedElementId === el.id;
                    const val = interpolateSample(el.value);

                    if (el.type === "text") {
                      return (
                        <div key={el.id} onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }} style={getElementStyle(el)}>
                          {val}
                        </div>
                      );
                    } else if (el.type === "barcode") {
                      return (
                        <div key={el.id} onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }} style={getElementStyle(el)}>
                          <Barcode value={val} height={Math.max(el.h * PX_PER_MM - 12, 10)} width={Math.max((el.w * PX_PER_MM) / 100 * el.barcodeScale, 0.5)} displayValue={el.showText} fontSize={8} margin={0} background="transparent" />
                        </div>
                      );
                    } else if (el.type === "logo") {
                      return (
                        <div key={el.id} onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }} style={getElementStyle(el)}>
                          {el.logoType === "hallmark" && <HallmarkIcon />}
                          {el.logoType === "diamond" && <DiamondIcon />}
                          {el.logoType === "ring" && <RingIcon />}
                          {el.logoType === "tag" && <TagIcon />}
                          {el.logoType === "box" && <BoxIcon />}
                        </div>
                      );
                    } else if (el.type === "line") {
                      return (
                        <div key={el.id} onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }} style={{
                          position: "absolute",
                          left: `${el.x * PX_PER_MM}px`,
                          top: `${el.y * PX_PER_MM}px`,
                          width: `${el.w * PX_PER_MM}px`,
                          height: `${el.h * PX_PER_MM}px`,
                          backgroundColor: "#000",
                          cursor: "pointer",
                          border: isSel ? "1.5px solid #0d6efd" : "none",
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
              Dimensions: {Math.round(singleLabelW * 10) / 10}mm × {labelH}mm.<br />
              {selectedTemplateId === "jewelry_dumbbell" && <span className="text-warning small"><i className="fa fa-info-circle me-1" />Jewelry Tag detected: Left flap (0-34mm), Right flap (42-76mm). Elements on Right are rotated 180° for folded alignment.</span>}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── STEP 4 UI: Print Previews & Actions ────────────────────────────────────────────
  const Step4 = () => {
    const singleLabelW = labelW / columns;
    const singleWpx = singleLabelW * PX_PER_MM;
    const hPx = labelH * PX_PER_MM;

    return (
      <div>
        <h5 className="fw-bold mb-1">Print Preview &amp; Actions</h5>
        <p className="text-muted small mb-3">Verify the print job preview and click <strong>Print Now</strong>.</p>

        {isOverflowing && (
          <div className="alert alert-danger p-2 small mb-3">
            <i className="fa fa-exclamation-triangle me-2" />
            <strong>Layout Warning:</strong> Some barcode elements in your template exceed label width or height bounds.
          </div>
        )}

        <div className="d-flex align-items-center gap-3 mb-3 p-3 bg-light border rounded flex-wrap">
          <div><strong>Printer:</strong> {printerName || <span className="text-danger">Not selected</span>}</div>
          <div><strong>Template:</strong> {templates.find(t => t.id === selectedTemplateId)?.name || "Default"}</div>
          <div><strong>Labels:</strong> {printQueue.length}</div>
          <div><strong>DPI:</strong> {dpi}</div>
          <button className="btn btn-success ms-auto px-4 py-2 fw-bold" onClick={handlePrint} disabled={printing || printQueue.length === 0 || !printerName}>
            {printing ? <><i className="fa fa-spinner fa-spin me-2" />Printing...</> : <><i className="fa fa-print me-2" />Print Now</>}
          </button>
        </div>

        {/* Label previews - each row = one physical print strip */}
        <div className="mb-2"><small className="text-muted"><i className="fa fa-info-circle me-1" />Each dashed box = 1 print strip ({columns} label{columns > 1 ? "s" : ""} side-by-side). Page width: <strong>{labelW}mm</strong>, per-label: <strong>{Math.round(singleLabelW * 10) / 10}mm</strong></small></div>
        <div ref={previewRef} style={{ display: "flex", flexDirection: "column", gap: 10, padding: 8 }}>
          {Array.from({ length: Math.ceil(Math.min(printQueue.length, 20) / columns) }).map((_, rowIdx) => {
            const rowLabels = (printQueue as any[]).slice(rowIdx * columns, rowIdx * columns + columns);
            return (
              <div key={rowIdx} style={{ display: "inline-flex", gap: 0, alignItems: "flex-start", border: "2px dashed #0d6efd", borderRadius: 6, padding: 4, background: "#f0f4ff", width: "fit-content" }}>
                {rowLabels.map((label: any, colIdx: number) => {
                  const isJewelry = selectedTemplateId === "jewelry_dumbbell" || selectedTemplateId === "jewelry_small" || selectedTemplateId === "jewelry_asym" || selectedTemplateId === "jewelry_81_12" || selectedTemplateId === "jewelry_100_13" || selectedTemplateId === "jewelry_100_15" || selectedTemplateId.toLowerCase().includes("jewelry") || selectedTemplateId.toLowerCase().includes("dumbbell");
                  const isApparel = (selectedTemplateId === "apparel" || selectedTemplateId.toLowerCase().includes("apparel") || selectedTemplateId.toLowerCase().includes("hang")) && labelH > 40;

                  const labelStyle: React.CSSProperties = isJewelry ? {
                    width: `${singleWpx}px`,
                    height: `${hPx}px`,
                    position: "relative",
                    background: "transparent",
                    flexShrink: 0
                  } : {
                    width: `${singleWpx}px`,
                    height: `${hPx}px`,
                    borderLeft: colIdx > 0 && !isApparel ? "1px dashed #aaa" : "none",
                    border: "1.5px solid #333",
                    position: "relative",
                    background: "#fff",
                    overflow: "hidden",
                    flexShrink: 0,
                    borderRadius: isApparel ? "8px" : "0px"
                  };

                  const getDumbbellDimensions = (w: number, h: number) => {
                    let tailL = w * 0.2; // default 20%
                    const nameLower = (selectedTemplateId || "").toLowerCase();
                    
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
                    <div key={colIdx} style={labelStyle}>
                      {/* Jewelry Dumbbell realistic backing card flaps */}
                      {isJewelry && (() => {
                        const { leftBound, rightBound, tailL, tailH, tailY, rightH, rightY } = getDumbbellDimensions(labelW, labelH);
                        return (
                          <>
                            {/* Left Flap */}
                            <div style={{ position: "absolute", left: 0, top: 0, width: `${leftBound * PX_PER_MM}px`, height: `${labelH * PX_PER_MM}px`, background: "#fff", border: "1px solid #cbd5e1", borderRight: "none", borderRadius: "4px 0 0 4px", pointerEvents: "none" }} />
                            {/* Tail */}
                            <div style={{ position: "absolute", left: `${leftBound * PX_PER_MM}px`, top: `${tailY * PX_PER_MM}px`, width: `${tailL * PX_PER_MM}px`, height: `${tailH * PX_PER_MM}px`, background: "#f8fafc", borderTop: "1px solid #cbd5e1", borderBottom: "1px solid #cbd5e1", pointerEvents: "none" }} />
                            {/* Right Flap */}
                            <div style={{ position: "absolute", left: `${rightBound * PX_PER_MM}px`, top: `${rightY * PX_PER_MM}px`, width: `${(labelW - rightBound) * PX_PER_MM}px`, height: `${rightH * PX_PER_MM}px`, background: "#fff", border: "1px solid #cbd5e1", borderLeft: "none", borderRadius: "0 4px 4px 0", pointerEvents: "none" }} />
                          </>
                        );
                      })()}

                      {/* Apparel thread hole */}
                      {isApparel && (
                        <div style={{ position: "absolute", left: `${(labelW / 2 - 2) * PX_PER_MM}px`, top: `${4 * PX_PER_MM}px`, width: `${4 * PX_PER_MM}px`, height: `${4 * PX_PER_MM}px`, backgroundColor: "#f0f4ff", borderRadius: "50%", border: "1.5px solid #cbd5e1", pointerEvents: "none", zIndex: 10 }} />
                      )}

                      {elements.map(el => {
                        const val = interpolate(el.value, label);

                        if (el.type === "text") {
                          return (
                            <div key={el.id} style={getElementStyle(el)}>
                              {val}
                            </div>
                          );
                        } else if (el.type === "barcode") {
                          return (
                            <div key={el.id} style={getElementStyle(el)}>
                              <Barcode value={val} height={Math.max(el.h * PX_PER_MM - 12, 10)} width={Math.max((el.w * PX_PER_MM) / 100 * el.barcodeScale, 0.5)} displayValue={el.showText} fontSize={8} margin={0} background="transparent" />
                            </div>
                          );
                        } else if (el.type === "logo") {
                          return (
                            <div key={el.id} style={getElementStyle(el)}>
                              {el.logoType === "hallmark" && <HallmarkIcon />}
                              {el.logoType === "diamond" && <DiamondIcon />}
                              {el.logoType === "ring" && <RingIcon />}
                              {el.logoType === "tag" && <TagIcon />}
                              {el.logoType === "box" && <BoxIcon />}
                            </div>
                          );
                        } else if (el.type === "line") {
                          return (
                            <div key={el.id} style={{
                              position: "absolute",
                              left: `${el.x * PX_PER_MM}px`,
                              top: `${el.y * PX_PER_MM}px`,
                              width: `${el.w * PX_PER_MM}px`,
                              height: `${el.h * PX_PER_MM}px`,
                              backgroundColor: "#000"
                            }} />
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {printQueue.length > 20 && <div style={{ color: "#6c757d", fontWeight: 600, padding: 8 }}>+{printQueue.length - 20} more labels ({Math.ceil((printQueue.length - 20) / columns) - 10} more rows)</div>}
        </div>
        {printQueue.length === 0 && <div className="text-center py-5 text-muted"><i className="fa fa-exclamation-circle fa-2x mb-3 d-block" />No labels queued. Go back and set quantities.</div>}
      </div>
    );
  };

  if (!item) return <div className="d-flex align-items-center justify-content-center" style={{ height: "100vh" }}><div className="text-center"><i className="fa fa-spinner fa-spin fa-2x mb-3 d-block text-primary" /><p>Loading...</p></div></div>;

  return (
    <div className="wiz-page" style={{ minHeight: "100vh", background: "#f0f2f5", color: "#212529" }}>
      {/* Header */}
      <div style={{ 
        background: "linear-gradient(90deg,#1a1a2e,#16213e)", 
        padding: "16px 24px", 
        display: "flex", 
        alignItems: "center", 
        gap: 16, 
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)" 
      }}>
        <button className="btn btn-outline-light btn-sm" onClick={() => window.close()}><i className="fa fa-arrow-left me-1" />Back</button>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>🏷️ Barcode Print Wizard</div>
          <div style={{ color: "#adb5bd", fontSize: 13 }}>{item.ItemName}</div>
        </div>
      </div>

      {/* Body container with vertical sidebar on the left and content pane on the right */}
      <div className="wiz-content" style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 16px" }}>
        <div className="row">
          {/* Left Sidebar Navigation */}
          <div className="col-md-3 col-xl-2 mb-4 mb-md-0">
            <div className="card p-3 border-0 shadow-sm" style={{ background: "#fff", borderRadius: 12 }}>
              <div className="d-flex flex-column gap-2">
                <button onClick={() => setActiveTab("print")}
                  className={`btn text-start py-2 px-3 fw-bold d-flex align-items-center gap-2 ${activeTab === "print" ? "btn-primary" : "btn-light"}`}
                  style={{
                    borderRadius: 8,
                    fontSize: 14,
                    transition: "all 0.15s ease",
                    boxShadow: activeTab === "print" ? "0 4px 12px rgba(13,110,253,0.25)" : "none",
                    border: "none"
                  }}>
                  <i className="fa fa-print" style={{ width: 18 }} /> Print Dashboard
                </button>
                <button onClick={() => setActiveTab("hardware")}
                  className={`btn text-start py-2 px-3 fw-bold d-flex align-items-center gap-2 ${activeTab === "hardware" ? "btn-primary" : "btn-light"}`}
                  style={{
                    borderRadius: 8,
                    fontSize: 14,
                    transition: "all 0.15s ease",
                    boxShadow: activeTab === "hardware" ? "0 4px 12px rgba(13,110,253,0.25)" : "none",
                    border: "none"
                  }}>
                  <i className="fa fa-cog" style={{ width: 18 }} /> Hardware Setup
                </button>
                <button onClick={() => setActiveTab("designer")}
                  className={`btn text-start py-2 px-3 fw-bold d-flex align-items-center gap-2 ${activeTab === "designer" ? "btn-primary" : "btn-light"}`}
                  style={{
                    borderRadius: 8,
                    fontSize: 14,
                    transition: "all 0.15s ease",
                    boxShadow: activeTab === "designer" ? "0 4px 12px rgba(13,110,253,0.25)" : "none",
                    border: "none"
                  }}>
                  <i className="fa fa-paint-brush" style={{ width: 18 }} /> Label Designer
                </button>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="col-md-9 col-xl-10">
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              {activeTab === "print" && (
                <div className="row">
                  <div className="col-lg-7 mb-4 mb-lg-0">
                    {Step1()}
                  </div>
                  <div className="col-lg-5 border-start ps-lg-4">
                    {Step4()}
                  </div>
                </div>
              )}
              {activeTab === "hardware" && (
                <div>
                  {Step2()}
                  <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                    <button className="btn btn-primary px-4 fw-bold" onClick={() => setActiveTab("print")}>
                      Go to Print Dashboard <i className="fa fa-arrow-right ms-2" />
                    </button>
                  </div>
                </div>
              )}
              {activeTab === "designer" && (
                <div>
                  {Step3()}
                  <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                    <button className="btn btn-primary px-4 fw-bold" onClick={() => setActiveTab("print")}>
                      Go to Print Dashboard <i className="fa fa-arrow-right ms-2" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
