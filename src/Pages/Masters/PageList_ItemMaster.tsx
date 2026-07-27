import React, { useCallback, useEffect, useMemo, useState } from "react";
import Barcode from 'react-barcode';
import Fuse from "fuse.js";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table, Badge, Pagination, PaginationItem, PaginationLink, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DeleteData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

const LIST_API_URL = `${API_WEB_URLS.MASTER}/0/token/ItemMasterData/Id/0`;
const DELETE_API_URL = `${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.ItemMaster}`;
const CATEGORY_LIST_URL = `${API_WEB_URLS.MASTER}/0/token/CategoryMaster/Id/0`;

const getFullImageUrl = (img: string | null | undefined) => {
  if (!img || typeof img !== "string" || img.trim() === "") return "";
  const trimmed = img.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `${API_WEB_URLS.IMAGEURL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

interface Element {
  id: string;
  type: "text" | "barcode" | "logo" | "line";
  value: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  fontWeight: "normal" | "bold";
  rotation: 0 | 90 | 180 | 270;
  alignment: 1 | 2 | 3;
  barcodeScale: number;
  showText: boolean;
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

// SVG Icons for Live Previews
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

interface ItemListState {
  ItemMasterList: any[];
  isProgress: boolean;
  filterText: string;
}

const PageList_ItemMaster = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<ItemListState>({
    ItemMasterList: [],
    isProgress: true,
    filterText: "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [gstGroups, setGstGroups] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [alterUnits, setAlterUnits] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [globalOptions, setGlobalOptions] = useState<any[]>([]);

  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterGstGroup, setFilterGstGroup] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Direct Variant Print Modal States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printItem, setPrintItem] = useState<any>(null);
  const [printVariant, setPrintVariant] = useState<any>(null);
  const [selectedPrintTemplateId, setSelectedPrintTemplateId] = useState("");
  const [printQty, setPrintQty] = useState(1);
  const [dbTemplates, setDbTemplates] = useState<Template[]>([]);
  const [localPrinters, setLocalPrinters] = useState<string[]>([]);
  const [selectedLocalPrinter, setSelectedLocalPrinter] = useState(() => {
    return localStorage.getItem("barcodePrinterName") || "";
  });
  const [printingDirectly, setPrintingDirectly] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<{ url: string; x: number; y: number } | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [state.filterText, filterCategory, filterGstGroup]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return url;
    try {
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      } else if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      } else if (url.includes("vimeo.com/")) {
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        if (id && !Number.isNaN(Number(id))) return `https://player.vimeo.com/video/${id}`;
      }
    } catch (e) {}
    return url;
  };

  const loadData = useCallback(() => {
    setState((prev) => ({ ...prev, isProgress: true }));

    Fn_FillListData(dispatch, () => {}, "custom", LIST_API_URL)
      .then((data: any) => {
        let rawList: any[] = [];
        if (Array.isArray(data)) rawList = data;
        else if (data?.data?.response && Array.isArray(data.data.response)) rawList = data.data.response;
        else if (data?.dataList && Array.isArray(data.dataList)) rawList = data.dataList;
        else if (data?.data?.dataList && Array.isArray(data.data.dataList)) rawList = data.data.dataList;
        
        setState((prev) => ({ ...prev, ItemMasterList: rawList, isProgress: false }));
      })
      .catch((error) => {
        console.error("Failed to load items:", error);
        setState((prev) => ({ ...prev, ItemMasterList: [], isProgress: false }));
      });
  }, [dispatch]);

  // Load configuration and masters on mount
  useEffect(() => {
    loadData();
    Fn_FillListData(dispatch, () => {}, "categories", CATEGORY_LIST_URL)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? [];
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(console.error);

    Fn_FillListData(dispatch, () => {}, "gstGroups", "Masters/0/token/GSTGroupMaster/Id/0")
      .then((data: any) => setGstGroups(Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? []))
      .catch(console.error);

    Fn_FillListData(dispatch, () => {}, "units", "Masters/0/token/UnitMaster/Id/0")
      .then((data: any) => setUnits(Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? []))
      .catch(console.error);

    Fn_FillListData(dispatch, () => {}, "alterUnits", "Masters/0/token/AlterUnitMaster/Id/0")
      .then((data: any) => setAlterUnits(Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? []))
      .catch(console.error);

    Fn_FillListData(dispatch, () => {}, "globalOptions", "Masters/0/token/GlobalOptions/Id/0")
      .then((data: any) => setGlobalOptions(Array.isArray(data) ? data : data?.dataList ?? data?.data?.dataList ?? []))
      .catch(console.error);
  }, [dispatch]);

  // Load custom templates and local printers
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const url = `${API_WEB_URLS.BASE}Masters/0/token/BarcodeTemplateMaster/Id/0`;
        const r = await fetch(url);
        if (r.ok) {
          const d = await r.json();
          const rawList = d?.data?.dataList || d?.data?.DataList || d?.response || [];
          if (Array.isArray(rawList)) {
            const parsed = rawList.map((item: any) => {
              try {
                return { ...JSON.parse(item.Name), id: String(item.Id), dbId: item.Id };
              } catch (e) {
                return null;
              }
            }).filter(Boolean);
            setDbTemplates(parsed);
            if (parsed.length > 0) {
              setSelectedPrintTemplateId(parsed[0].id);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load barcode templates", e);
      }
    };
    fetchTemplates();

    const checkPrinters = async () => {
      try {
        const r = await fetch("http://127.0.0.1:9187/printers");
        if (r.ok) {
          const d = await r.json();
          const list: string[] = d.printers || [];
          setLocalPrinters(list);
          if (list.length > 0 && !localStorage.getItem("barcodePrinterName")) {
            setSelectedLocalPrinter(d.defaultPrinter || list[0]);
            localStorage.setItem("barcodePrinterName", d.defaultPrinter || list[0]);
          }
        }
      } catch (e) {}
    };
    checkPrinters();
  }, []);

  const handleAdd = () => {
    navigate("/addEditItemMaster", { state: { Id: 0 } });
  };

  const handleEdit = (id: number | string) => {
    navigate("/addEditItemMaster", { state: { Id: id } });
  };

  const handleDelete = (id: number | string) => {
    if (!id) return;
    const itemToDelete = state.ItemMasterList.find((item: any) => item?.Id === id);
    const itemName = itemToDelete?.Name || itemToDelete?.ItemName || itemToDelete?.LedgerName || itemToDelete?.CompanyName || itemToDelete?.UserName || itemToDelete?.VoucherName || itemToDelete?.GroupName || itemToDelete?.AdminName || itemToDelete?.Title || itemToDelete?.RoleName || itemToDelete?.CityName || itemToDelete?.StateName || itemToDelete?.CountryName || itemToDelete?.MaterialName || "this item";
    if (window.confirm(`Are you sure you want to delete '${itemName}'?`)) {
      Fn_DeleteData(dispatch, () => {}, Number(id), DELETE_API_URL).catch(() => {
        setState((prev) => {
          if (!itemToDelete) return prev;
          const newList = [...prev.ItemMasterList, itemToDelete].sort((a, b) => a.Id - b.Id);
          return { ...prev, ItemMasterList: newList };
        });
      });
      
      setState((prev) => ({
        ...prev,
        ItemMasterList: prev.ItemMasterList.filter((item: any) => item?.Id !== id),
      }));
    }
  };

  // Open direct print modal for a variant
  const handlePrintBarcodes = (item: any, variant?: any) => {
    if (variant) {
      setPrintItem(item);
      setPrintVariant(variant);
      setPrintQty(1);
      // Select the first template as default
      const all = dbTemplates;
      if (all.length > 0) {
        setSelectedPrintTemplateId(all[0].id);
      } else {
        setSelectedPrintTemplateId("");
      }
      setIsPrintModalOpen(true);
    }
  };

  // Build TSPL command
  const buildTsplForPrint = (template: Template, item: any, variant: any, quantity: number, firmName: string) => {
    const dpi = 203;
    const dots = 8;
    const { labelW, labelH, columns, rowGap, elements } = template;
    const singleLabelW = labelW / columns;
    
    const queue = Array(quantity).fill({
      barcode: variant.Barcode || "",
      itemName: item.ItemName || "",
      sizeName: variant.SizeName || "Std",
      salePrice: String(variant.SalePrice || "0"),
      hsnCode: item.HSNCode || ""
    });

    let cmd = "";
    for (let i = 0; i < queue.length; i += columns) {
      const row = queue.slice(i, i + columns);
      cmd += `SIZE ${labelW} mm, ${labelH} mm\nGAP ${rowGap} mm, 0 mm\nDIRECTION 1\nCLS\n`;

      row.forEach((label: any, colIdx: number) => {
        const colXmm = colIdx * singleLabelW;

        elements.forEach((el) => {
          let val = el.value || "";
          val = val.replace(/\{\{FirmName\}\}/g, firmName);
          val = val.replace(/\{\{ItemName\}\}/g, label.itemName);
          val = val.replace(/\{\{SalePrice\}\}/g, label.salePrice);
          val = val.replace(/\{\{Barcode\}\}/g, label.barcode);
          val = val.replace(/\{\{SizeName\}\}/g, label.sizeName);
          val = val.replace(/\{\{HSNCode\}\}/g, label.hsnCode);

          const actualXmm = colXmm + el.x;
          const actualYmm = el.y;

          const xDots = Math.round(actualXmm * dots);
          const yDots = Math.round(actualYmm * dots);

          if (el.type === "text") {
            const font = String(el.fontSize || 2);
            const rotation = el.rotation || 0;
            const align = el.alignment || 1;
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
            cmd += `BARCODE ${xDots}, ${yDots}, "128", ${bh}, ${showText}, ${rotation}, ${scale}, ${scale}, "${val}"\n`;
          } else if (el.type === "line") {
            const lwDots = Math.round(el.w * dots);
            const lhDots = Math.round(el.h * dots);
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

  const handleDirectPrint = async () => {
    if (!selectedLocalPrinter) {
      toast.error("Please select a printer first.");
      return;
    }
    const all = dbTemplates;
    const template = all.find(t => t.id === selectedPrintTemplateId);
    if (!template) {
      toast.error("Selected template layout not found.");
      return;
    }

    setPrintingDirectly(true);
    const firm = globalOptions[0]?.FirmName || "FIRM NAME";
    const tspl = buildTsplForPrint(template, printItem, printVariant, printQty, firm);

    try {
      const response = await fetch("http://127.0.0.1:9187/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tspl, printerName: selectedLocalPrinter.trim() })
      });
      const d = await response.json();
      if (response.ok && d.success) {
        toast.success("✅ Barcode printed successfully!");
        setIsPrintModalOpen(false);
      } else {
        toast.error(`Print Error: ${d.error || "Failed to print"}`);
      }
    } catch (err) {
      toast.error("Cannot connect to Local Print Agent. Make sure it is running.");
    } finally {
      setPrintingDirectly(false);
    }
  };

  const handleOpenAdvancedWizard = () => {
    if (printItem && printVariant) {
      const itemToPrint = { ...printItem, DesignDetails: [printVariant] };
      sessionStorage.setItem("barcodePrintItem", JSON.stringify(itemToPrint));
      sessionStorage.setItem("barcodePrintFirmName", globalOptions[0]?.FirmName || "FIRM NAME");
      localStorage.setItem("barcodeSelectedTemplateId", selectedPrintTemplateId);
      window.open(`${process.env.PUBLIC_URL}/barcodePrintWizard`, "_blank");
      setIsPrintModalOpen(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((prev) => ({
      ...prev,
      filterText: value,
    }));
  };

  const filteredList = useMemo(() => {
    const rawList = Array.isArray(state.ItemMasterList) ? state.ItemMasterList : [];
    let result = rawList;

    if (filterCategory) {
      result = result.filter(item => String(item?.F_CategoryMaster) === String(filterCategory));
    }
    
    if (filterGstGroup) {
      result = result.filter(item => String(item?.F_GSTGroupMaster) === String(filterGstGroup));
    }

    const searchText = state.filterText.trim();
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      
      const exactBarcodeMatches = result.filter(item => {
        let parsedDesign: any[] = [];
        try {
          if (typeof item.DesignDetails === "string") {
            parsedDesign = JSON.parse(item.DesignDetails || "[]");
          } else if (Array.isArray(item.DesignDetails)) {
            parsedDesign = item.DesignDetails;
          }
        } catch (e) {}
        return parsedDesign.some(d => d.Barcode && d.Barcode.toLowerCase().includes(lowerSearch));
      });

      const fuse = new Fuse(result, {
        keys: ["ItemName", "HSNCode", "ItemCode", "Code"],
        threshold: 0.3,
        ignoreLocation: true,
      });
      const fuseResults = fuse.search(searchText).map((res: any) => res.item);
      
      const combined = [...exactBarcodeMatches];
      fuseResults.forEach(item => {
        if (!combined.some(c => c.Id === item.Id)) {
          combined.push(item);
        }
      });
      result = combined;
    }

    return result;
  }, [state.ItemMasterList, state.filterText, filterCategory, filterGstGroup]);

  const allTemplates = useMemo(() => {
    return dbTemplates;
  }, [dbTemplates]);

  return (
    <>
      <div className="page-body">
        <Breadcrumbs mainTitle="Item Master" parent="Masters" />
        <Container fluid>
          <Row>
            <Col xs="12">
              <Card>
                <CardHeaderCommon title="Item Master List" tagClass="card-title mb-0" />
                <CardBody>
                  <div className="p-3 mb-4 bg-light rounded border">
                    <Row className="g-3 align-items-end">
                      <Col md="3">
                        <Label className="mb-1 text-muted fw-bold" style={{ fontSize: "0.85rem" }}>Search Items</Label>
                        <Input
                          type="search"
                          placeholder="Search Item..."
                          value={state.filterText}
                          onChange={handleSearchChange}
                          list="item-search-suggestions"
                        />
                        <datalist id="item-search-suggestions">
                          {Array.from(new Set(state.ItemMasterList.map(item => item?.ItemName).filter(Boolean))).map((name, index) => (
                            <option key={index} value={name as string} />
                          ))}
                        </datalist>
                      </Col>
                      <Col md="3">
                        <Label className="mb-1 text-muted fw-bold" style={{ fontSize: "0.85rem" }}>Category</Label>
                        <Input
                          type="select"
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                        >
                          <option value="">All Categories</option>
                          {categories.map((c: any) => (
                            <option key={c.Id} value={c.Id}>
                              {c.Name || c.GroupName || c.Id}
                            </option>
                          ))}
                        </Input>
                      </Col>
                      <Col md="2">
                        <Label className="mb-1 text-muted fw-bold" style={{ fontSize: "0.85rem" }}>GST Group</Label>
                        <Input
                          type="select"
                          value={filterGstGroup}
                          onChange={(e) => setFilterGstGroup(e.target.value)}
                        >
                          <option value="">All GST Groups</option>
                          {gstGroups.map((g: any) => (
                            <option key={g.Id} value={g.Id}>
                              {g.GSTGroupName || g.Id}
                            </option>
                          ))}
                        </Input>
                      </Col>
                      <Col md="2">
                        <Btn color="success" onClick={loadData} className="w-100">
                          <i className="fa fa-refresh me-2" />
                          Refresh
                        </Btn>
                      </Col>
                      <Col md="2">
                        <Btn color="primary" onClick={handleAdd} className="w-100">
                          <i className="fa fa-plus me-2" />
                          Add Item
                        </Btn>
                      </Col>
                    </Row>
                  </div>

                  {(() => {
                    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
                    const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    
                    return state.isProgress ? (
                       <div className="text-center py-5">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                      <Table bordered hover style={{ verticalAlign: 'middle' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Variant / Info</th>
                            <th>Length</th>
                            <th>Width</th>
                            <th>Height</th>
                            <th>Weight</th>
                            <th>Unit Val</th>
                            <th>Price</th>
                            <th>Available Qty</th>
                            <th>Barcode</th>
                            <th>IsEcommerce</th>
                            <th>Photos</th>
                            <th>Video Link</th>
                            <th style={{ width: 100 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredList.length === 0 ? (
                            <tr>
                              <td colSpan={13} className="text-center py-4">
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            currentItems.map((item: any, index: number) => {
                              const absoluteIndex = (currentPage - 1) * itemsPerPage + index;
                              let parsedDesign: any[] = [];
                              try {
                                if (typeof item.DesignDetails === "string") {
                                  parsedDesign = JSON.parse(item.DesignDetails || "[]");
                                } else if (Array.isArray(item.DesignDetails)) {
                                  parsedDesign = item.DesignDetails;
                                }
                              } catch (e) {}

                              let filteredDesign = parsedDesign;
                              const currentSearchText = state.filterText.trim().toLowerCase();
                              if (currentSearchText) {
                                const matchingVariants = parsedDesign.filter((d: any) => d.Barcode && d.Barcode.toLowerCase().includes(currentSearchText));
                                if (matchingVariants.length > 0) {
                                  filteredDesign = matchingVariants;
                                }
                              }

                              const isAutoExpanded = currentSearchText !== "" && filteredDesign !== parsedDesign;
                              const isRowExpanded = expandedRows[String(item?.Id ?? index)] || isAutoExpanded;
                              
                              return (
                                <React.Fragment key={item?.Id ?? index}>
                                  {/* Item Master Header Row */}
                                  <tr className="table-primary">
                                    <td colSpan={12}>
                                      <Btn 
                                        color="primary" 
                                        outline 
                                        size="sm" 
                                        className="me-2 px-2 py-0 rounded-circle" 
                                        style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                        onClick={() => toggleRow(String(item?.Id ?? index))}
                                        title={isRowExpanded ? "Collapse" : "Expand"}
                                      >
                                        <i className={`fa ${isRowExpanded ? "fa-chevron-down" : "fa-chevron-right"}`} />
                                      </Btn>
                                      {item?.CoverImage && (
                                        <a href={getFullImageUrl(item.CoverImage)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                                          <img
                                            src={getFullImageUrl(item.CoverImage_Thumb || item.CoverImage)}
                                            alt="Cover"
                                            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                                            title="Cover Image - Click to view"
                                          />
                                        </a>
                                      )}
                                      <strong>#{absoluteIndex + 1} - {item?.ItemName || "-"}</strong>
                                      <span className="mx-2">|</span>
                                      <strong>HSN:</strong> {item?.HSNCode || "-"}
                                      <span className="mx-2">|</span>
                                      <strong>Has Size:</strong> {item?.HasSize ? "Yes" : "No"}
                                      <span className="mx-2">|</span>
                                      <strong>Category:</strong> {
                                        categories.find(c => String(c.Id) === String(item?.F_CategoryMaster))?.Name 
                                        ?? categories.find(c => String(c.Id) === String(item?.F_CategoryMaster))?.GroupName 
                                        ?? item?.F_CategoryMaster 
                                        ?? "-"
                                      }
                                      <span className="mx-2">|</span>
                                      <strong>GST:</strong> {
                                        gstGroups.find(g => String(g.Id) === String(item?.F_GSTGroupMaster))?.GSTGroupName
                                        ?? item?.F_GSTGroupMaster 
                                        ?? "-"
                                      }
                                      <span className="mx-2">|</span>
                                      <strong>Unit:</strong> {
                                        units.find(u => String(u.Id) === String(item?.F_UnitMaster))?.UnitName
                                        ?? item?.F_UnitMaster 
                                        ?? "-"
                                      }
                                    </td>
                                    <td>
                                      <Btn color="primary" size="sm" className="me-2" onClick={() => handleEdit(item?.Id)} title="Edit Item">
                                        <i className="fa fa-edit" />
                                      </Btn>
                                      <Btn color="danger" size="sm" onClick={() => handleDelete(item?.Id)} title="Delete Item">
                                        <i className="fa fa-trash" />
                                      </Btn>
                                    </td>
                                  </tr>
                                  
                                  {/* Item Design Master Variant Rows */}
                                  {isRowExpanded && (
                                    filteredDesign.length === 0 ? (
                                      <tr>
                                        <td colSpan={13} className="text-center text-muted py-2">
                                          No variants available for this item.
                                        </td>
                                      </tr>
                                    ) : (
                                      filteredDesign.map((d: any, dIdx: number) => {
                                      const images = [
                                        { full: d.DesignPhoto, thumb: d.DesignPhoto_Thumb },
                                        { full: d.DesignPhoto2, thumb: d.DesignPhoto2_Thumb },
                                        { full: d.DesignPhoto3, thumb: d.DesignPhoto3_Thumb },
                                        { full: d.DesignPhoto4, thumb: d.DesignPhoto4_Thumb },
                                        { full: d.DesignPhoto5, thumb: d.DesignPhoto5_Thumb }
                                      ].filter(img => img.full && img.full.trim() !== "");

                                      return (
                                        <tr key={d.Id || dIdx}>
                                          <td className="ps-4">Variant {dIdx + 1} ({d.SizeName || "Std"})</td>
                                          <td>{d.Length || "-"}</td>
                                          <td>{d.Width || "-"}</td>
                                          <td>{d.Height || "-"}</td>
                                          <td>{d.Weight || "-"}</td>
                                          <td>{d.UnitConversion || "-"}</td>
                                          <td>₹{d.SalePrice || "0"}</td>
                                          <td>
                                            <Badge color={Number(d.AvailableQty) > 0 ? "success" : "secondary"}>
                                              {d.AvailableQty !== undefined && d.AvailableQty !== null ? d.AvailableQty : 0}
                                            </Badge>
                                          </td>
                                          <td>
                                            {d.Barcode && d.Barcode.trim() !== "" ? (
                                              <div style={{ width: '100%', minWidth: '120px' }}>
                                                <style>{`.im-barcode-svg-${d.Id || dIdx} svg { width: 100% !important; height: auto !important; max-height: 80px; }`}</style>
                                                <div className={`im-barcode-svg-${d.Id || dIdx}`}>
                                                  <Barcode value={d.Barcode} width={2} height={60} displayValue={true} fontSize={16} margin={0} background="transparent" />
                                                </div>
                                              </div>
                                            ) : (
                                              "-"
                                            )}
                                          </td>
                                          <td>
                                            {d.IsEcom ? (
                                              <Badge color="success">Yes</Badge>
                                            ) : (
                                              <Badge color="danger">No</Badge>
                                            )}
                                          </td>
                                          <td>
                                            <div className="d-flex flex-wrap gap-2">
                                              {images.map((img: any, i: number) => (
                                                <a href={img.full} target="_blank" rel="noopener noreferrer" key={i}>
                                                  <img 
                                                    src={img.thumb && img.thumb.trim() !== "" ? img.thumb : img.full} 
                                                    alt={`img-${i}`} 
                                                    style={{ width: 45, height: 45, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }} 
                                                    title="Click to view full size"
                                                    onMouseEnter={(e) => {
                                                      const rect = e.currentTarget.getBoundingClientRect();
                                                      setHoveredImage({
                                                        url: img.full || img.thumb,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top
                                                      });
                                                    }}
                                                    onMouseLeave={() => setHoveredImage(null)}
                                                  />
                                                </a>
                                              ))}
                                              {images.length === 0 && <span className="text-muted small">No photos</span>}
                                            </div>
                                          </td>
                                          <td>
                                            {d.VideoLink && d.VideoLink.trim() !== "" ? (
                                              activeVideo === (d.Id || dIdx) ? (
                                                <div>
                                                  <iframe 
                                                    src={getEmbedUrl(d.VideoLink)} 
                                                    style={{ width: "200px", height: "120px", border: "none", borderRadius: "4px" }} 
                                                    allowFullScreen
                                                    title={`Video-${d.Id}`}
                                                  />
                                                  <div className="mt-1">
                                                    <Btn color="secondary" size="xs" onClick={() => setActiveVideo(null)} style={{ padding: "0.1rem 0.3rem", fontSize: "0.7rem" }}>
                                                      Close Video
                                                    </Btn>
                                                  </div>
                                                </div>
                                              ) : (
                                                <span 
                                                  className="text-primary text-decoration-underline" 
                                                  style={{ cursor: 'pointer' }}
                                                  onClick={() => setActiveVideo(d.Id || dIdx)}
                                                >
                                                  View Video
                                                </span>
                                              )
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )}
                                          </td>
                                          <td>
                                            <Btn color="info" size="sm" onClick={() => handlePrintBarcodes(item, d)} title="Print Variant Barcode">
                                              <i className="fa fa-print" />
                                            </Btn>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ))}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </Table>
                    </div>
                          
                    {totalPages > 0 && (
                      <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded border">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                          <div className="text-muted small">
                            Showing {filteredList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredList.length)} of {filteredList.length} items
                          </div>
                          <div className="d-flex align-items-center ms-0 ms-md-3">
                            <Label className="mb-0 me-2 small text-muted text-nowrap">Rows:</Label>
                            <Input
                              type="number"
                              bsSize="sm"
                              min="1"
                              max="20"
                              value={itemsPerPage || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                  setItemsPerPage(Math.min(20, Math.max(1, val)));
                                  setCurrentPage(1);
                                } else {
                                  setItemsPerPage(10);
                                  setCurrentPage(1);
                                }
                              }}
                              style={{ width: "70px" }}
                            />
                          </div>
                        </div>
                        <Pagination className="mb-0">
                          <PaginationItem disabled={currentPage === 1}>
                            <PaginationLink previous onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} />
                          </PaginationItem>
                          {[...Array(totalPages)].map((_, i) => {
                            if (i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 2 && i + 1 <= currentPage + 2)) {
                              return (
                                <PaginationItem active={i + 1 === currentPage} key={i}>
                                  <PaginationLink onClick={() => setCurrentPage(i + 1)}>
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            if (i + 1 === currentPage - 3 || i + 1 === currentPage + 3) {
                              return <PaginationItem disabled key={i}><PaginationLink>...</PaginationLink></PaginationItem>;
                            }
                            return null;
                          })}
                          <PaginationItem disabled={currentPage === totalPages}>
                            <PaginationLink next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} />
                          </PaginationItem>
                        </Pagination>
                      </div>
                    )}
                      </>
                    );
                  })()}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Direct Barcode Print Picker Modal */}
      <Modal isOpen={isPrintModalOpen} toggle={() => setIsPrintModalOpen(false)} centered style={{ color: "#212529" }}>
        <ModalHeader toggle={() => setIsPrintModalOpen(false)} className="bg-primary text-white py-3 fw-bold">
          <i className="fa fa-print me-2" /> Print Barcode Label
        </ModalHeader>
        <ModalBody className="p-4" style={{ color: "#212529" }}>
          {printItem && printVariant && (
            <>
              <div className="mb-3 p-3 bg-light rounded border">
                <div style={{ fontSize: "14.5px" }} className="mb-1"><strong>Item:</strong> {printItem.ItemName}</div>
                <div style={{ fontSize: "13.5px" }} className="mb-1"><strong>Variant:</strong> {printVariant.SizeName || "Std"}</div>
                <div style={{ fontSize: "13.5px" }} className="mb-1"><strong>Barcode:</strong> {printVariant.Barcode}</div>
                <div style={{ fontSize: "13.5px" }}><strong>Price:</strong> ₹{printVariant.SalePrice || "0"}</div>
              </div>

              <FormGroup className="mb-3">
                <Label className="fw-bold small">Select Barcode Template</Label>
                <Input type="select" value={selectedPrintTemplateId} onChange={(e) => setSelectedPrintTemplateId(e.target.value)}>
                  {allTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.labelW}x{t.labelH}mm)</option>
                  ))}
                </Input>
              </FormGroup>

              {(() => {
                const selectedTemplateObj = allTemplates.find(t => t.id === selectedPrintTemplateId);
                if (!selectedTemplateObj) return null;

                const { labelW, labelH, columns, elements } = selectedTemplateObj;
                const singleLabelW = labelW / columns;
                const PX_PER_MM = 2.5; // Scaled down nicely for modal popup
                const singleWpx = singleLabelW * PX_PER_MM;
                const hPx = labelH * PX_PER_MM;

                const isJewelry = selectedTemplateObj.id === "jewelry_dumbbell" || selectedTemplateObj.id === "jewelry_small" || selectedTemplateObj.id === "jewelry_asym" || selectedTemplateObj.id === "jewelry_81_12" || selectedTemplateObj.id === "jewelry_100_13" || selectedTemplateObj.id === "jewelry_100_15" || selectedTemplateObj.name.toLowerCase().includes("jewelry") || selectedTemplateObj.name.toLowerCase().includes("dumbbell");
                const isApparel = (selectedTemplateObj.id === "apparel" || selectedTemplateObj.name.toLowerCase().includes("apparel") || selectedTemplateObj.name.toLowerCase().includes("hang")) && labelH > 40;

                const canvasStyle: React.CSSProperties = isJewelry ? {
                  width: `${singleWpx}px`,
                  height: `${hPx}px`,
                  position: "relative",
                  background: "transparent",
                  border: "none",
                  flexShrink: 0
                } : {
                  width: `${singleWpx}px`,
                  height: `${hPx}px`,
                  border: "1.5px solid #cbd5e1",
                  position: "relative",
                  background: "#fff",
                  overflow: "hidden",
                  flexShrink: 0,
                  borderRadius: isApparel ? "8px" : "0px"
                };

                const getDumbbellDimensions = (w: number, h: number) => {
                  let tailL = w * 0.2; // default 20%
                  const nameLower = (selectedTemplateObj.name || "").toLowerCase();
                  
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

                const firmName = globalOptions[0]?.FirmName || "FIRM NAME";

                const interpolateSample = (val: string) => {
                  let s = val || "";
                  s = s.replace(/\{\{FirmName\}\}/g, firmName);
                  s = s.replace(/\{\{ItemName\}\}/g, printItem.ItemName || "");
                  s = s.replace(/\{\{SalePrice\}\}/g, String(printVariant.SalePrice || "0"));
                  s = s.replace(/\{\{Barcode\}\}/g, printVariant.Barcode || "89012345");
                  s = s.replace(/\{\{SizeName\}\}/g, printVariant.SizeName || "Std");
                  s = s.replace(/\{\{HSNCode\}\}/g, printItem.HSNCode || "");
                  return s;
                };

                const getElementStyle = (el: any): React.CSSProperties => {
                  const rotation = el.rotation || 0;
                  return {
                    position: "absolute",
                    left: `${el.x * PX_PER_MM}px`,
                    top: `${el.y * PX_PER_MM}px`,
                    width: `${el.w * PX_PER_MM}px`,
                    height: `${el.h * PX_PER_MM}px`,
                    fontSize: `${Math.max(4.5, (el.fontSize || 2) * 2.2)}px`,
                    fontWeight: el.fontWeight || "normal",
                    transform: rotation ? `rotate(${rotation}deg)` : undefined,
                    transformOrigin: "top left",
                    color: "#000",
                    fontFamily: "monospace",
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    pointerEvents: "none"
                  };
                };

                return (
                  <div className="mb-3 d-flex flex-column align-items-center justify-content-center p-3 border rounded bg-dark border-secondary position-relative overflow-hidden" style={{ minHeight: 120 }}>
                    <span className="badge bg-light text-dark mb-2" style={{ fontSize: "9px" }}><i className="fa fa-eye me-1" />Sticker Live Preview ({labelW}x{labelH}mm)</span>
                    <div style={canvasStyle}>
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

                      {/* Apparel card thread hole */}
                      {isApparel && (
                        <div style={{ position: "absolute", left: `${(labelW / 2 - 2) * PX_PER_MM}px`, top: `${4 * PX_PER_MM}px`, width: `${4 * PX_PER_MM}px`, height: `${4 * PX_PER_MM}px`, backgroundColor: "#212529", borderRadius: "50%", border: "1px solid #cbd5e1", pointerEvents: "none", zIndex: 10 }} />
                      )}

                      {elements.map((el: any) => {
                        const val = interpolateSample(el.value);

                        if (el.type === "text") {
                          return (
                            <div key={el.id} style={getElementStyle(el)}>
                              {val}
                            </div>
                          );
                        } else if (el.type === "barcode") {
                          return (
                            <div key={el.id} style={getElementStyle(el)}>
                              <Barcode value={val} height={Math.max(el.h * PX_PER_MM - 6, 6)} width={Math.max((el.w * PX_PER_MM) / 100 * el.barcodeScale, 0.4)} displayValue={el.showText} fontSize={5} margin={0} background="transparent" />
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
                  </div>
                );
              })()}

              <FormGroup className="mb-3">
                <Label className="fw-bold small">Select Active Printer</Label>
                <div className="d-flex gap-2">
                  <Input type="select" value={selectedLocalPrinter} onChange={(e) => { setSelectedLocalPrinter(e.target.value); localStorage.setItem("barcodePrinterName", e.target.value); }}>
                    {localPrinters.length > 0 ? (
                      localPrinters.map(p => <option key={p} value={p}>{p}</option>)
                    ) : (
                      <option value="">TVS LP 46 NEO (Default)</option>
                    )}
                  </Input>
                </div>
                {localPrinters.length === 0 && (
                  <span className="text-danger small mt-1 d-block"><i className="fa fa-exclamation-triangle me-1" />Local Companion Print Agent is offline. Direct printing requires companion agent.</span>
                )}
              </FormGroup>

              <FormGroup className="mb-3">
                <Label className="fw-bold small">Print Quantity</Label>
                <Input type="number" min="1" max="1000" value={printQty} onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))} />
              </FormGroup>
            </>
          )}
        </ModalBody>
        <ModalFooter className="bg-light d-flex justify-content-between p-3 border-top">
          <span className="text-primary text-decoration-underline small cursor-pointer" style={{ cursor: "pointer" }} onClick={handleOpenAdvancedWizard}>
            <i className="fa fa-cogs me-1" /> Open Advanced Print Wizard
          </span>
          <div className="d-flex gap-2">
            <Btn color="secondary" size="sm" className="fw-bold" onClick={() => setIsPrintModalOpen(false)}>Cancel</Btn>
            <Btn color="primary" size="sm" className="fw-bold" onClick={handleDirectPrint} disabled={printingDirectly}>
              {printingDirectly ? <><i className="fa fa-spinner fa-spin me-1" />Printing...</> : <><i className="fa fa-check me-1" />Print Now</>}
            </Btn>
          </div>
        </ModalFooter>
      </Modal>

      {hoveredImage && (
        <div
          style={{
            position: "fixed",
            top: hoveredImage.y - 215 < 10 ? hoveredImage.y + 50 : hoveredImage.y - 215,
            left: Math.min(window.innerWidth - 220, Math.max(10, hoveredImage.x - 100)),
            zIndex: 99999,
            background: "#ffffff",
            padding: "6px",
            borderRadius: "8px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)",
            border: "1px solid #cbd5e1",
            pointerEvents: "none"
          }}
        >
          <img
            src={hoveredImage.url}
            alt="Preview"
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: "6px",
              display: "block"
            }}
          />
        </div>
      )}
    </>
  );
};

export default PageList_ItemMaster;
