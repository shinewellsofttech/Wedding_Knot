import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Input,
  Label,
  FormGroup,
  Table,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  InputGroup,
  InputGroupText,
} from "reactstrap";
import Barcode from "react-barcode";
import { toast } from "react-toastify";

interface VariantDetail {
  Id: number | string;
  SizeName?: string;
  ItemDesignName?: string;
  SalePrice?: number | string;
  Barcode?: string;
  OpeningStock?: number | string;
  Length?: string | number;
  Width?: string | number;
  Height?: string | number;
  Weight?: string | number;
  [key: string]: any;
}


interface ItemDetail {
  Id: number | string;
  ItemName: string;
  HSNCode?: string;
  HasSize?: boolean;
  DesignDetails: VariantDetail[] | string;
}

interface PrinterPaperSize {
  name: string;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  kind: number;
}

interface PrinterInfo {
  paperSizes: PrinterPaperSize[];
  resolutions: number[];
  defaultPaperName: string;
  defaultWidthMm: number;
  defaultHeightMm: number;
  defaultDpi: number;
  isLandscape: boolean;
}

interface BarcodePrinterSetupModalProps {
  isOpen: boolean;
  toggle: () => void;
  item: ItemDetail | null;
  firmName?: string;
}

export const BarcodePrinterSetupModal: React.FC<BarcodePrinterSetupModalProps> = ({
  isOpen,
  toggle,
  item,
  firmName = "FIRM NAME",
}) => {
  // Parse variants safely
  const variants = useMemo<VariantDetail[]>(() => {
    if (!item) return [];
    try {
      if (typeof item.DesignDetails === "string") {
        return JSON.parse(item.DesignDetails || "[]");
      } else if (Array.isArray(item.DesignDetails)) {
        return item.DesignDetails;
      }
    } catch (e) {
      console.error("Failed to parse variants:", e);
    }
    return [];
  }, [item]);

  // Configurations State
  const [activeTab, setActiveTab] = useState<string>("variants");
  
  // Dimensions & Grid Unit: "mm" or "in"
  const [unit, setUnit] = useState<"mm" | "in">("in"); // Default to inches as per request
  
  // Printer Feed Type: "roll" (thermal) or "sheet" (A4/Letter)
  const [printerMode, setPrinterMode] = useState<"roll" | "sheet">("roll");
  
  // Label Preset Key
  const [labelPreset, setLabelPreset] = useState<string>("4x6_single");

  // Label Dimension States (Stored in Millimeters for internal consistency)
  const [labelWidth, setLabelWidth] = useState<number>(101.6); // 4 inches in mm
  const [labelHeight, setLabelHeight] = useState<number>(152.4); // 6 inches in mm
  const [columns, setColumns] = useState<number>(1);
  const [columnGap, setColumnGap] = useState<number>(0); // mm
  const [rowGap, setRowGap] = useState<number>(3.175); // 1/8 inch in mm

  // Outer Label Margins (mm)
  const [marginTop, setMarginTop] = useState<number>(2.0);
  const [marginBottom, setMarginBottom] = useState<number>(2.0);
  const [marginLeft, setMarginLeft] = useState<number>(2.0);
  const [marginRight, setMarginRight] = useState<number>(2.0);

  // Sheet Mode Parameters (if printerMode === "sheet")
  const [sheetType, setSheetType] = useState<"A4" | "Letter" | "Custom">("A4");
  const [sheetWidth, setSheetWidth] = useState<number>(210); // mm
  const [sheetHeight, setSheetHeight] = useState<number>(297); // mm
  const [rowsPerSheet, setRowsPerSheet] = useState<number>(5);
  const [pageMarginTop, setPageMarginTop] = useState<number>(10); // mm
  const [pageMarginBottom, setPageMarginBottom] = useState<number>(10); // mm
  const [pageMarginLeft, setPageMarginLeft] = useState<number>(10); // mm
  const [pageMarginRight, setPageMarginRight] = useState<number>(10); // mm

  // Print Orientation Option
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("auto");

  // DPI for TSPL Exporter
  const [dpi, setDpi] = useState<number>(203);

  // Content Customizer Options
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [logoHeight, setLogoHeight] = useState<number>(6.35); // mm (~0.25 inch)
  const [showFirmName, setShowFirmName] = useState<boolean>(true);
  const [customFirmName, setCustomFirmName] = useState<string>(firmName);
  const [firmFontSize, setFirmFontSize] = useState<number>(10); // px
  
  const [showItemName, setShowItemName] = useState<boolean>(true);
  const [itemNameFontSize, setItemNameFontSize] = useState<number>(9); // px
  const [itemNameMaxChars, setItemNameMaxChars] = useState<number>(30);
  
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [pricePrefix, setPricePrefix] = useState<string>("MRP: ₹");
  const [priceFontSize, setPriceFontSize] = useState<number>(10); // px

  const [barcodeHeight, setBarcodeHeight] = useState<number>(25.4); // mm (~1 inch)
  const [barcodeScale, setBarcodeScale] = useState<number>(1.5);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);

  // Local Companion Print Agent States
  const [isAgentActive, setIsAgentActive] = useState<boolean>(false);
  const [printerName, setPrinterName] = useState<string>("");
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isFetchingPrinters, setIsFetchingPrinters] = useState<boolean>(false);
  const [printerInfo, setPrinterInfo] = useState<PrinterInfo | null>(null);
  const [selectedPaperSize, setSelectedPaperSize] = useState<string>("");
  const [isFetchingPrinterInfo, setIsFetchingPrinterInfo] = useState<boolean>(false);

  // Variant printing table inputs
  const [selectedVariants, setSelectedVariants] = useState<Record<string, boolean>>({});
  const [printQtys, setPrintQtys] = useState<Record<string, number>>({});
  const [printPrices, setPrintPrices] = useState<Record<string, string>>({});
  const [printItemNames, setPrintItemNames] = useState<Record<string, string>>({});

  // Unit Conversions
  const mmToIn = (val: number) => parseFloat((val / 25.4).toFixed(3));
  const inToMm = (val: number) => parseFloat((val * 25.4).toFixed(2));

  const displayVal = (mmVal: number) => {
    return unit === "in" ? parseFloat((mmVal / 25.4).toFixed(2)) : mmVal;
  };

  const handleValChange = (displayVal: number, setter: (mmVal: number) => void) => {
    const mmVal = unit === "in" ? displayVal * 25.4 : displayVal;
    setter(mmVal);
  };

  // Sync customFirmName with prop when modal opens
  useEffect(() => {
    if (isOpen && firmName) {
      setCustomFirmName(firmName);
    }
  }, [isOpen, firmName]);

  const fetchPrinters = async () => {
    setIsFetchingPrinters(true);
    try {
      const res = await fetch("http://127.0.0.1:9187/printers", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        const list: string[] = data.printers || [];
        setAvailablePrinters(list);
        // Auto-select default printer if nothing selected yet
        if (data.defaultPrinter && !printerName) {
          setPrinterName(data.defaultPrinter);
        } else if (list.length > 0 && !printerName) {
          setPrinterName(list[0]);
        }
      }
    } catch (e) {
      // silently fail; agent may not be running
    } finally {
      setIsFetchingPrinters(false);
    }
  };

  // Apply paper size & DPI → auto-configure all layout settings
  const applyPaperSize = (paper: PrinterPaperSize, dpiVal: number) => {
    const { widthMm, heightMm } = paper;
    const isSheet = widthMm >= 180 || heightMm >= 250; // A4/Letter territory

    if (isSheet) {
      setPrinterMode("sheet");
      setSheetWidth(widthMm);
      setSheetHeight(heightMm);
      // Typical 2-column layout for sheets
      setColumns(2);
      setRowsPerSheet(5);
      const lw = Math.round((widthMm - 20 - 5) / 2 * 10) / 10; // 10mm side margins, 5mm gap
      setLabelWidth(lw);
      setLabelHeight(Math.round(heightMm / 5 - 5)); // ~5 rows with 5mm gap
      setPageMarginTop(10); setPageMarginBottom(10);
      setPageMarginLeft(10); setPageMarginRight(10);
    } else {
      setPrinterMode("roll");
      setColumns(1);
      setLabelWidth(widthMm);
      setLabelHeight(heightMm);
    }

    setDpi(dpiVal);

    // Auto-margins: ~3% of each dimension, min 1.5mm
    const mH = Math.max(Math.round(heightMm * 0.03 * 10) / 10, 1.5);
    const mW = Math.max(Math.round(widthMm  * 0.03 * 10) / 10, 1.5);
    setMarginTop(mH); setMarginBottom(mH);
    setMarginLeft(mW); setMarginRight(mW);

    // Auto-barcode height: ~35% of label height, min 10mm
    const bcH = Math.max(Math.round(heightMm * 0.35 * 10) / 10, 10);
    setBarcodeHeight(bcH);

    // Auto-scale based on label width
    const scale = widthMm < 55 ? 1.0 : widthMm < 76 ? 1.4 : widthMm < 102 ? 1.8 : 2.2;
    setBarcodeScale(scale);

    // Auto-font sizes
    const fontSize = widthMm < 55 ? 8 : widthMm < 76 ? 9 : 10;
    setFirmFontSize(fontSize);
    setItemNameFontSize(Math.max(fontSize - 1, 7));

    // Row gap for thermal roll
    setRowGap(widthMm < 60 ? 1.0 : 2.0);

    toast.success(
      `Layout auto-configured for ${paper.name} (${paper.widthIn}" × ${paper.heightIn}") @ ${dpiVal} DPI`,
      { autoClose: 3000 }
    );
  };

  const fetchPrinterInfo = async (name: string) => {
    if (!name) return;
    setIsFetchingPrinterInfo(true);
    setPrinterInfo(null);
    setSelectedPaperSize("");
    try {
      const res = await fetch(
        `http://127.0.0.1:9187/printer-info?name=${encodeURIComponent(name)}`
      );
      if (res.ok) {
        const data: PrinterInfo = await res.json();
        setPrinterInfo(data);
        setDpi(data.defaultDpi);
        setSelectedPaperSize(data.defaultPaperName);
        // Find the default paper size object and auto-apply
        const defPaper = data.paperSizes.find((p) => p.name === data.defaultPaperName);
        if (defPaper) {
          applyPaperSize(defPaper, data.defaultDpi);
        } else if (data.paperSizes.length > 0) {
          applyPaperSize(data.paperSizes[0], data.defaultDpi);
          setSelectedPaperSize(data.paperSizes[0].name);
        }
      } else {
        toast.warning("Could not fetch printer capabilities. Configure layout manually.");
      }
    } catch (e) {
      console.error("fetchPrinterInfo error:", e);
    } finally {
      setIsFetchingPrinterInfo(false);
    }
  };

  const checkAgentStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:9187/ping", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK") {
          setIsAgentActive(true);
          await fetchPrinters();
          return;
        }
      }
      setIsAgentActive(false);
    } catch (e) {
      setIsAgentActive(false);
    }
  };

  // Auto-fetch printer info when printer selection changes
  useEffect(() => {
    if (printerName && isAgentActive) {
      fetchPrinterInfo(printerName);
    } else if (!printerName) {
      setPrinterInfo(null);
      setSelectedPaperSize("");
    }
  }, [printerName]);

  // Check if Local Print Agent is running when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAgentStatus();
    }
  }, [isOpen]);

  // Prepopulate print settings for the variants when a new item is selected
  useEffect(() => {
    if (!item || variants.length === 0) return;

    const initialSelected: Record<string, boolean> = {};
    const initialQtys: Record<string, number> = {};
    const initialPrices: Record<string, string> = {};
    const initialNames: Record<string, string> = {};

    variants.forEach((d, idx) => {
      const key = String(d.Id || idx);
      // Select variants that have a barcode by default
      initialSelected[key] = !!d.Barcode;
      initialQtys[key] = d.Barcode ? 1 : 0;
      initialPrices[key] = d.SalePrice ? `${d.SalePrice}` : "0";
      
      const sizeSuffix = d.SizeName ? ` - ${d.SizeName}` : "";
      initialNames[key] = `${item.ItemName}${sizeSuffix}`;
    });

    setSelectedVariants(initialSelected);
    setPrintQtys(initialQtys);
    setPrintPrices(initialPrices);
    setPrintItemNames(initialNames);
  }, [item, variants]);

  // Handle Preset Changes (Loads pre-calibrated sizes in MM)
  const handlePresetChange = (preset: string) => {
    setLabelPreset(preset);
    switch (preset) {
      // MM Presets
      case "50x25_single":
        setPrinterMode("roll");
        setLabelWidth(50);
        setLabelHeight(25);
        setColumns(1);
        setColumnGap(0);
        setRowGap(2);
        setMarginTop(1);
        setMarginLeft(1);
        setMarginRight(1);
        setMarginBottom(1);
        setBarcodeHeight(10);
        setBarcodeScale(1.2);
        setLogoHeight(3);
        setOrientation("auto");
        break;
      case "38x25_single":
        setPrinterMode("roll");
        setLabelWidth(38);
        setLabelHeight(25);
        setColumns(1);
        setColumnGap(0);
        setRowGap(2);
        setMarginTop(1);
        setMarginLeft(1);
        setMarginRight(1);
        setMarginBottom(1);
        setBarcodeHeight(9);
        setBarcodeScale(1.0);
        setLogoHeight(2.5);
        setOrientation("auto");
        break;
      case "50x25_double":
        setPrinterMode("roll");
        setLabelWidth(50);
        setLabelHeight(25);
        setColumns(2);
        setColumnGap(2);
        setRowGap(2);
        setMarginTop(1);
        setMarginLeft(1);
        setMarginRight(1);
        setMarginBottom(1);
        setBarcodeHeight(9);
        setBarcodeScale(1.1);
        setLogoHeight(3);
        setOrientation("auto");
        break;

      // Inches Presets
      case "4x6_single":
        setPrinterMode("roll");
        setLabelWidth(101.6); // 4"
        setLabelHeight(152.4); // 6"
        setColumns(1);
        setColumnGap(0);
        setRowGap(3.175);
        setMarginTop(3);
        setMarginLeft(3);
        setMarginRight(3);
        setMarginBottom(3);
        setBarcodeHeight(30);
        setBarcodeScale(2.0);
        setLogoHeight(10);
        setOrientation("portrait");
        break;
      case "4x4_single":
        setPrinterMode("roll");
        setLabelWidth(101.6); // 4"
        setLabelHeight(101.6); // 4"
        setColumns(1);
        setColumnGap(0);
        setRowGap(3.175);
        setMarginTop(3);
        setMarginLeft(3);
        setMarginRight(3);
        setMarginBottom(3);
        setBarcodeHeight(25.4);
        setBarcodeScale(2.0);
        setLogoHeight(8);
        setOrientation("portrait");
        break;
      case "2x4_single":
        setPrinterMode("roll");
        setLabelWidth(50.8); // 2"
        setLabelHeight(101.6); // 4"
        setColumns(1);
        setColumnGap(0);
        setRowGap(3.175);
        setMarginTop(3);
        setMarginLeft(3);
        setMarginRight(3);
        setMarginBottom(3);
        setBarcodeHeight(25.4);
        setBarcodeScale(1.2);
        setLogoHeight(5);
        setOrientation("portrait");
        break;
      case "4x2_single":
        setPrinterMode("roll");
        setLabelWidth(101.6); // 4"
        setLabelHeight(50.8); // 2"
        setColumns(1);
        setColumnGap(0);
        setRowGap(2);
        setMarginTop(2);
        setMarginLeft(3);
        setMarginRight(3);
        setMarginBottom(2);
        setBarcodeHeight(15);
        setBarcodeScale(2.0);
        setLogoHeight(6);
        setOrientation("landscape");
        break;
      case "3x2_single":
        setPrinterMode("roll");
        setLabelWidth(76.2); // 3"
        setLabelHeight(50.8); // 2"
        setColumns(1);
        setColumnGap(0);
        setRowGap(2);
        setMarginTop(2);
        setMarginLeft(2.5);
        setMarginRight(2.5);
        setMarginBottom(2);
        setBarcodeHeight(15);
        setBarcodeScale(1.6);
        setLogoHeight(5);
        setOrientation("landscape");
        break;
      case "2x1_single":
        setPrinterMode("roll");
        setLabelWidth(50.8); // 2"
        setLabelHeight(25.4); // 1"
        setColumns(1);
        setColumnGap(0);
        setRowGap(2);
        setMarginTop(1.5);
        setMarginLeft(2);
        setMarginRight(2);
        setMarginBottom(1.5);
        setBarcodeHeight(8);
        setBarcodeScale(1.1);
        setLogoHeight(3);
        setOrientation("landscape");
        break;

      // Sheet Presets (A4 Sheet grids)
      case "A4_2x5_sheet":
        setPrinterMode("sheet");
        setSheetType("A4");
        setSheetWidth(210);
        setSheetHeight(297);
        setColumns(2);
        setRowsPerSheet(5);
        setLabelWidth(95); // 95mm x 50mm typical
        setLabelHeight(50);
        setColumnGap(5);
        setRowGap(5);
        setPageMarginTop(15);
        setPageMarginBottom(15);
        setPageMarginLeft(10);
        setPageMarginRight(10);
        setMarginTop(2);
        setMarginLeft(2);
        setMarginRight(2);
        setMarginBottom(2);
        setBarcodeHeight(12);
        setBarcodeScale(1.8);
        setLogoHeight(5);
        setOrientation("portrait");
        break;
      case "A4_3x8_sheet":
        setPrinterMode("sheet");
        setSheetType("A4");
        setSheetWidth(210);
        setSheetHeight(297);
        setColumns(3);
        setRowsPerSheet(8);
        setLabelWidth(63.5); // 63.5mm x 38mm standard label sheet
        setLabelHeight(33.9);
        setColumnGap(2.5);
        setRowGap(0);
        setPageMarginTop(13);
        setPageMarginBottom(13);
        setPageMarginLeft(8);
        setPageMarginRight(8);
        setMarginTop(1.5);
        setMarginLeft(2);
        setMarginRight(2);
        setMarginBottom(1.5);
        setBarcodeHeight(9);
        setBarcodeScale(1.1);
        setLogoHeight(3.5);
        setOrientation("portrait");
        break;
      default:
        break;
    }
  };

  const handleSheetTypeChange = (type: "A4" | "Letter" | "Custom") => {
    setSheetType(type);
    if (type === "A4") {
      setSheetWidth(210);
      setSheetHeight(297);
    } else if (type === "Letter") {
      setSheetWidth(215.9); // 8.5"
      setSheetHeight(279.4); // 11"
    }
  };

  // Toggle selection for all variants
  const handleSelectAll = (checked: boolean) => {
    const nextSelected = { ...selectedVariants };
    variants.forEach((d, idx) => {
      const key = String(d.Id || idx);
      if (d.Barcode) {
        nextSelected[key] = checked;
      }
    });
    setSelectedVariants(nextSelected);
  };

  // Generate TSPL code for direct TVS LP 46 Neo printing
  const tsplCode = useMemo(() => {
    if (!item) return "";
    const dotsPerMm = dpi === 300 ? 11.8 : 8;

    // Total roll width matches grid width
    const totalPageWidthMm =
      columns === 1 ? labelWidth : labelWidth * columns + columnGap * (columns - 1);

    let commands = "";
    const queue: { barcode: string; name: string; price: string }[] = [];

    variants.forEach((d, idx) => {
      const key = String(d.Id || idx);
      if (selectedVariants[key] && printQtys[key] > 0 && d.Barcode) {
        const qty = printQtys[key];
        const name = printItemNames[key] || item.ItemName;
        const price = printPrices[key] || "0";
        for (let i = 0; i < qty; i++) {
          queue.push({
            barcode: d.Barcode,
            name,
            price,
          });
        }
      }
    });

    if (queue.length === 0) {
      return "; No labels queued. Select variants and enter quantity > 0.";
    }

    // Process labels row by row based on columns setting
    for (let i = 0; i < queue.length; i += columns) {
      const row = queue.slice(i, i + columns);

      commands += `; --- Page/Row ${Math.floor(i / columns) + 1} ---\n`;
      commands += `SIZE ${totalPageWidthMm} mm, ${labelHeight} mm\n`;
      commands += `GAP ${rowGap} mm, 0 mm\n`;
      commands += `DIRECTION 1\n`;
      commands += `CLS\n`;

      row.forEach((label, colIdx) => {
        const labelXStartMm = marginLeft + colIdx * (labelWidth + columnGap);
        const labelXStart = Math.round(labelXStartMm * dotsPerMm);

        let currentY = marginTop * dotsPerMm;

        // 1. Logo
        if (showLogo) {
          commands += `; LOGO PLACEHOLDER at X: ${labelXStart}, Y: ${Math.round(currentY)}\n`;
        }

        // 2. Firm Name
        if (showFirmName) {
          const firmY = Math.round(currentY);
          commands += `TEXT ${labelXStart + 24}, ${firmY}, "3", 0, 1, 1, "${customFirmName}"\n`;
          currentY += (firmFontSize + 6);
        }

        // 3. Item Name
        if (showItemName) {
          const nameY = Math.round(currentY);
          const truncated =
            label.name.length > itemNameMaxChars
              ? label.name.substring(0, itemNameMaxChars) + ".."
              : label.name;
          commands += `TEXT ${labelXStart + 16}, ${nameY}, "2", 0, 1, 1, "${truncated}"\n`;
          currentY += (itemNameFontSize + 8);
        }

        // 4. Barcode
        const bcY = Math.round(currentY);
        const bcHeightDots = Math.round(barcodeHeight * dotsPerMm);
        commands += `BARCODE ${labelXStart + 16}, ${bcY}, "128", ${bcHeightDots}, ${
          showBarcodeText ? 1 : 0
        }, 0, 2, 2, "${label.barcode}"\n`;
        
        currentY += bcHeightDots + (showBarcodeText ? 18 : 6);

        // 5. Price
        if (showPrice) {
          const priceY = Math.round(currentY);
          commands += `TEXT ${labelXStart + 24}, ${priceY}, "3", 0, 1, 1, "${pricePrefix}${label.price}"\n`;
        }
      });

      commands += `PRINT 1\n\n`;
    }

    return commands;
  }, [
    item,
    variants,
    selectedVariants,
    printQtys,
    printPrices,
    printItemNames,
    labelWidth,
    labelHeight,
    columns,
    columnGap,
    rowGap,
    marginTop,
    marginLeft,
    dpi,
    showLogo,
    showFirmName,
    customFirmName,
    showItemName,
    itemNameMaxChars,
    showPrice,
    pricePrefix,
    barcodeHeight,
    showBarcodeText,
    firmFontSize,
    itemNameFontSize,
  ]);

  // Copy TSPL
  const handleCopyTspl = () => {
    navigator.clipboard.writeText(tsplCode);
    toast.success("TSPL code copied to clipboard!");
  };

  // Download TSPL
  const handleDownloadTspl = () => {
    const element = document.createElement("a");
    const file = new Blob([tsplCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${item?.ItemName.replace(/\s+/g, "_") || "barcode"}_labels.prn`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Direct USB Printing using WebUSB API (bypass print dialog completely)
  const handleDirectUsbPrint = async () => {
    try {
      const nav = navigator as any;
      if (!nav.usb) {
        toast.error("WebUSB is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
        return;
      }

      toast.info("Connecting to printer... Please select your USB printer in the browser popup.");

      const device = await nav.usb.requestDevice({ filters: [] });
      await device.open();
      await device.selectConfiguration(1);

      let interfaceNumber = 0;
      let endpointOut = 0;

      const interfaces = device.configuration?.interfaces || [];
      for (const iface of interfaces) {
        const alternate = iface.alternates[0];
        // Printer class is 7, or vendor specific class is 255
        if (alternate.interfaceClass === 7 || alternate.interfaceClass === 255) {
          interfaceNumber = iface.interfaceNumber;
          for (const ep of alternate.endpoints) {
            if (ep.direction === "out" && ep.type === "bulk") {
              endpointOut = ep.endpointNumber;
              break;
            }
          }
        }
        if (endpointOut !== 0) break;
      }

      if (endpointOut === 0) {
        // Fallback search: any bulk out endpoint
        for (const iface of interfaces) {
          for (const alt of iface.alternates) {
            for (const ep of alt.endpoints) {
              if (ep.direction === "out" && ep.type === "bulk") {
                interfaceNumber = iface.interfaceNumber;
                endpointOut = ep.endpointNumber;
                break;
              }
            }
            if (endpointOut !== 0) break;
          }
          if (endpointOut !== 0) break;
        }
      }

      if (endpointOut === 0) {
        throw new Error("Could not find a raw bulk OUT printing channel on this USB device.");
      }

      await device.claimInterface(interfaceNumber);

      const encoder = new TextEncoder();
      const data = encoder.encode(tsplCode);

      await device.transferOut(endpointOut, data);
      await device.releaseInterface(interfaceNumber);
      await device.close();

      toast.success("Barcodes sent directly to the USB printer!");
    } catch (err: any) {
      console.error("Direct USB Print Error:", err);
      if (err.message && err.message.includes("Access denied")) {
        toast.error(
          <div className="text-start">
            <strong className="d-block mb-1">Direct Print Failed: Access Denied</strong>
            Windows has locked this USB printer. To unlock it for direct browser print:
            <ol className="ps-3 mt-2 mb-0 small">
              <li>Download & open <strong>Zadig</strong> from <a href="https://zadig.akeo.ie/" target="_blank" rel="noreferrer" style={{color: '#ffc107', fontWeight: 'bold'}}>zadig.akeo.ie</a></li>
              <li>Go to <strong>Options</strong> &gt; check <strong>List All Devices</strong>.</li>
              <li>Select your TVS printer in the dropdown.</li>
              <li>Set target driver to <strong>WinUSB</strong>.</li>
              <li>Click <strong>Replace Driver</strong>.</li>
            </ol>
            <span className="d-block mt-2 small text-warning">This is required once because Windows locks raw USB access by default.</span>
          </div>,
          { autoClose: false, closeOnClick: false }
        );
      } else {
        toast.error(`Direct Print Failed: ${err.message || err}`);
      }
    }
  };

  // Direct Serial/COM Port Printing using Web Serial API (bypasses Windows driver lock)
  const handleDirectSerialPrint = async () => {
    try {
      const nav = navigator as any;
      if (!nav.serial) {
        toast.error("Web Serial is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
        return;
      }

      toast.info("Connecting to printer... Please select your printer's virtual COM/Serial Port in the browser popup.");

      const port = await nav.serial.requestPort();
      // Open port (TVS LP 46 NEO virtual COM uses 9600 or 115200 baud)
      await port.open({ baudRate: 9600 });

      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      
      const data = encoder.encode(tsplCode);
      await writer.write(data);
      
      writer.releaseLock();
      await port.close();

      toast.success("Barcodes sent directly to the Serial/COM printer!");
    } catch (err: any) {
      console.error("Direct Serial Print Error:", err);
      toast.error(`Serial Print Failed: ${err.message || err}`);
    }
  };

  // Direct Spooler Printing via Local Companion Agent EXE (No driver replacement needed)
  const handleLocalAgentPrint = async () => {
    // --- Frontend validation before hitting the agent ---
    if (!printerName || !printerName.trim()) {
      toast.error(
        <div>
          <strong>Printer Name is required.</strong>
          <br />
          Please enter the exact Windows printer name (e.g. <i>"TVS LP 46 NEO"</i>) in the
          &nbsp;<strong>1-Click Direct Printer Settings</strong> section above.
        </div>,
        { autoClose: 6000 }
      );
      return;
    }

    if (!tsplCode || !tsplCode.includes("PRINT")) {
      toast.warning("No labels queued. Please select variants and enter a print quantity greater than 0.");
      return;
    }

    try {
      toast.info("Sending barcode print request to Local Agent...");
      const response = await fetch("http://127.0.0.1:9187/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tspl: tsplCode,
          printerName: printerName.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Barcodes sent to local printer queue successfully!");
      } else {
        toast.error(`Agent Print Error: ${data.error || "Failed to print"}`);
      }
    } catch (err: any) {
      console.error("Local Print Agent Error:", err);
      toast.error(
        <div>
          <strong>Could not connect to Local Print Agent</strong>
          <br />
          Make sure <strong>LocalPrintAgent.exe</strong> is running on your computer.
          <br />
          <a href="/print-agent/LocalPrintAgent.exe" download className="btn btn-warning btn-sm mt-2 text-dark fw-bold w-100">
            Download LocalPrintAgent.exe
          </a>
        </div>,
        { autoClose: false, closeOnClick: false }
      );
    }
  };

  // Print Queue
  const printQueue = useMemo(() => {
    const queue: { barcode: string; name: string; price: string; id: string | number }[] = [];
    variants.forEach((d, idx) => {
      const key = String(d.Id || idx);
      if (selectedVariants[key] && printQtys[key] > 0 && d.Barcode) {
        const qty = printQtys[key];
        const name = printItemNames[key] || item?.ItemName || "";
        const price = printPrices[key] || "0";
        for (let i = 0; i < qty; i++) {
          queue.push({
            barcode: d.Barcode,
            name,
            price,
            id: d.Id || idx,
          });
        }
      }
    });
    return queue;
  }, [variants, selectedVariants, printQtys, printItemNames, printPrices, item]);

  // Perform standard Web Printing using calibrated CSS
  const handleWebPrint = () => {
    const queue = printQueue;
    if (queue.length === 0) {
      toast.warning("Please select variants and enter a print quantity greater than 0.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print barcodes.");
      return;
    }

    const totalWidthMm =
      columns === 1 ? labelWidth : labelWidth * columns + columnGap * (columns - 1);

    const autoOrientation = printerMode === "roll"
      ? (totalWidthMm > labelHeight ? "landscape" : "portrait")
      : (sheetWidth > sheetHeight ? "landscape" : "portrait");

    const activeOrientation = orientation === "auto" ? autoOrientation : orientation;
    const orientationStr = ` ${activeOrientation}`;

    let htmlContent = "";

    // 1. Grid Sheet Printing (A4/Letter Sheets)
    if (printerMode === "sheet") {
      const labelsPerSheet = columns * rowsPerSheet;
      const sheets: typeof queue[] = [];
      for (let i = 0; i < queue.length; i += labelsPerSheet) {
        sheets.push(queue.slice(i, i + labelsPerSheet));
      }

      htmlContent = `
        <html>
          <head>
            <title>Print Label Sheet - ${item?.ItemName || ""}</title>
            <style>
              @media print {
                @page {
                  size: ${sheetWidth}mm ${sheetHeight}mm${orientationStr};
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: #fff;
                }
                .no-print {
                  display: none !important;
                }
                .sheet-page {
                  width: ${sheetWidth}mm;
                  height: ${sheetHeight}mm;
                  box-sizing: border-box;
                  padding-top: ${pageMarginTop}mm;
                  padding-bottom: ${pageMarginBottom}mm;
                  padding-left: ${pageMarginLeft}mm;
                  padding-right: ${pageMarginRight}mm;
                  page-break-after: always;
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                }
              }
              
              body {
                font-family: sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f1f3f5;
                display: flex;
                flex-direction: column;
                align-items: center;
              }

              .no-print-bar {
                width: 100%;
                background: #2b3035;
                color: white;
                padding: 15px 30px;
                box-sizing: border-box;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: sticky;
                top: 0;
                z-index: 9999;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }

              .no-print-bar button {
                padding: 10px 24px;
                background: #198754;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
              }

              .instructions {
                font-size: 12px;
                color: #ced4da;
                margin: 0;
              }

              .instructions strong {
                color: #ffc107;
              }

              .preview-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
                padding: 30px;
                align-items: center;
              }

              .sheet-page {
                background: white;
                border: 1px dashed #bbb;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                width: ${sheetWidth}mm;
                height: ${sheetHeight}mm;
                box-sizing: border-box;
                padding-top: ${pageMarginTop}mm;
                padding-bottom: ${pageMarginBottom}mm;
                padding-left: ${pageMarginLeft}mm;
                padding-right: ${pageMarginRight}mm;
                overflow: hidden;
                display: flex;
                flex-direction: column;
              }

              .labels-grid {
                display: grid;
                grid-template-columns: repeat(${columns}, ${labelWidth}mm);
                grid-template-rows: repeat(${rowsPerSheet}, ${labelHeight}mm);
                gap: ${rowGap}mm ${columnGap}mm;
                justify-content: center;
                align-content: start;
                height: 100%;
                width: 100%;
              }

              .label-card {
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                overflow: hidden;
                padding: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
              }

              .header-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                width: 100%;
                overflow: hidden;
              }

              .logo-img {
                height: ${logoHeight}mm;
                width: auto;
                object-fit: contain;
              }

              .firm-name {
                font-weight: bold;
                font-size: ${firmFontSize}px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .item-name {
                font-size: ${itemNameFontSize}px;
                text-align: center;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .barcode-wrapper {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: ${barcodeHeight}mm;
                overflow: hidden;
              }

              .barcode-wrapper svg {
                width: 100% !important;
                height: auto !important;
                max-height: ${barcodeHeight}mm !important;
              }

              .price-row {
                font-size: ${priceFontSize}px;
                font-weight: bold;
                text-align: center;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              @media print {
                .no-print-bar {
                  display: none !important;
                }
                .preview-container {
                  padding: 0 !important;
                }
                .sheet-page {
                  box-shadow: none !important;
                  border: none !important;
                  background: transparent !important;
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body>
            <div class="no-print-bar no-print">
              <div>
                <h3 style="margin: 0 0 5px 0;">Print Label Sheet (Grid Layout)</h3>
                <p class="instructions">
                  Paper size: <strong>${sheetType === "Custom" ? `${sheetWidth}x${sheetHeight}mm` : sheetType}</strong>. 
                  Set Margins to <strong>None</strong>, Scale to <strong>100%</strong>, and matching Orientation (<strong>${orientation}</strong>).
                </p>
              </div>
              <button onclick="window.print()">Print Now</button>
            </div>
            <div class="preview-container">
      `;

      sheets.forEach((sheetLabels) => {
        htmlContent += `
          <div class="sheet-page">
            <div class="labels-grid">
        `;
        
        // Print columns * rowsPerSheet slots
        for (let cellIdx = 0; cellIdx < labelsPerSheet; cellIdx++) {
          const itemInCell = sheetLabels[cellIdx];
          if (itemInCell) {
            const parentBarcodeEl = window.document.getElementById(`hidden-bc-${itemInCell.id}`);
            const barcodeSvgHtml = parentBarcodeEl ? parentBarcodeEl.innerHTML : "";

            htmlContent += `
              <div class="label-card">
                <div class="header-row">
                  ${showLogo ? `<img src="/assets/images/Wedding-logo.png" class="logo-img" />` : ""}
                  ${showFirmName ? `<span class="firm-name">${customFirmName}</span>` : ""}
                </div>
                ${showItemName ? `<div class="item-name">${itemInCell.name}</div>` : ""}
                <div class="barcode-wrapper">${barcodeSvgHtml}</div>
                ${showPrice ? `<div class="price-row">${pricePrefix}${itemInCell.price}</div>` : ""}
              </div>
            `;
          } else {
            // Empty placeholder to preserve grid alignment
            htmlContent += `<div class="label-card" style="visibility: hidden;"></div>`;
          }
        }

        htmlContent += `
            </div>
          </div>
        `;
      });

      htmlContent += `</div></body></html>`;

    } 
    // 2. Roll Feed Printing (Row-by-Row Feed)
    else {
      // Chunk queue into rows
      const pages: typeof queue[] = [];
      for (let i = 0; i < queue.length; i += columns) {
        pages.push(queue.slice(i, i + columns));
      }

      const totalWidthMm =
        columns === 1 ? labelWidth : labelWidth * columns + columnGap * (columns - 1);

      htmlContent = `
        <html>
          <head>
            <title>Print Barcode Roll - ${item?.ItemName || ""}</title>
            <style>
              @media print {
                @page {
                  size: ${totalWidthMm}mm ${labelHeight}mm${orientationStr};
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: #fff;
                }
                .no-print {
                  display: none !important;
                }
                .page {
                  width: ${totalWidthMm}mm;
                  height: ${labelHeight}mm;
                  display: flex;
                  gap: ${columnGap}mm;
                  page-break-after: always;
                  box-sizing: border-box;
                  padding-top: ${marginTop}mm;
                  padding-bottom: ${marginBottom}mm;
                  padding-left: ${marginLeft}mm;
                  padding-right: ${marginRight}mm;
                  overflow: hidden;
                }
              }
              
              body {
                font-family: sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f1f3f5;
                display: flex;
                flex-direction: column;
                align-items: center;
              }

              .no-print-bar {
                width: 100%;
                background: #2b3035;
                color: white;
                padding: 15px 30px;
                box-sizing: border-box;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: sticky;
                top: 0;
                z-index: 9999;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }

              .no-print-bar button {
                padding: 10px 24px;
                background: #198754;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
              }

              .instructions {
                font-size: 12px;
                color: #ced4da;
                margin: 0;
              }

              .preview-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
                padding: 30px;
                align-items: center;
              }

              .page {
                background: white;
                border: 1px dashed #999;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                width: ${totalWidthMm}mm;
                height: ${labelHeight}mm;
                display: flex;
                gap: ${columnGap}mm;
                box-sizing: border-box;
                padding-top: ${marginTop}mm;
                padding-bottom: ${marginBottom}mm;
                padding-left: ${marginLeft}mm;
                padding-right: ${marginRight}mm;
                overflow: hidden;
              }

              .label-card {
                width: ${labelWidth}mm;
                height: 100%;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                overflow: hidden;
              }

              .header-row {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                width: 100%;
                overflow: hidden;
              }

              .logo-img {
                height: ${logoHeight}mm;
                width: auto;
                object-fit: contain;
              }

              .firm-name {
                font-weight: bold;
                font-size: ${firmFontSize}px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .item-name {
                font-size: ${itemNameFontSize}px;
                text-align: center;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .barcode-wrapper {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: ${barcodeHeight}mm;
                overflow: hidden;
              }

              .barcode-wrapper svg {
                width: 100% !important;
                height: auto !important;
                max-height: ${barcodeHeight}mm !important;
              }

              .price-row {
                font-size: ${priceFontSize}px;
                font-weight: bold;
                text-align: center;
                width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              @media print {
                .no-print-bar {
                  display: none !important;
                }
                .preview-container {
                  padding: 0 !important;
                }
                .page {
                  box-shadow: none !important;
                  border: none !important;
                  background: transparent !important;
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body>
            <div class="no-print-bar no-print">
              <div>
                <h3 style="margin: 0 0 5px 0;">Print Barcode Labels (Roll Feed)</h3>
                <p class="instructions">
                  Set Paper Size to: <strong>${totalWidthMm}mm x ${labelHeight}mm</strong> (or matching Label). 
                  Margins: <strong>None</strong>, Scale: <strong>100%</strong>, Orientation: <strong>${activeOrientation}</strong>.
                </p>
              </div>
              <button onclick="window.print()">Print Now</button>
            </div>
            <div class="preview-container">
      `;

      pages.forEach((pageRow) => {
        htmlContent += `<div class="page">`;
        
        for (let col = 0; col < columns; col++) {
          const itemInCol = pageRow[col];
          if (itemInCol) {
            const parentBarcodeEl = window.document.getElementById(`hidden-bc-${itemInCol.id}`);
            const barcodeSvgHtml = parentBarcodeEl ? parentBarcodeEl.innerHTML : "";

            htmlContent += `
              <div class="label-card">
                <div class="header-row">
                  ${showLogo ? `<img src="/assets/images/Wedding-logo.png" class="logo-img" />` : ""}
                  ${showFirmName ? `<span class="firm-name">${customFirmName}</span>` : ""}
                </div>
                ${showItemName ? `<div class="item-name">${itemInCol.name}</div>` : ""}
                <div class="barcode-wrapper">${barcodeSvgHtml}</div>
                ${showPrice ? `<div class="price-row">${pricePrefix}${itemInCol.price}</div>` : ""}
              </div>
            `;
          } else {
            htmlContent += `<div class="label-card" style="visibility: hidden;"></div>`;
          }
        }
        
        htmlContent += `</div>`;
      });

      htmlContent += `</div></body></html>`;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Preview Grid Render Logic
  const firstActiveVariant = useMemo(() => {
    return variants.find((d) => d.Barcode) || variants[0] || null;
  }, [variants]);

  const previewLabels = useMemo(() => {
    if (!item || !firstActiveVariant) return [];
    
    const selectedList: { barcode: string; name: string; price: string; id: string | number }[] = [];
    
    variants.forEach((d, idx) => {
      const key = String(d.Id || idx);
      if (selectedVariants[key] && printQtys[key] > 0 && d.Barcode) {
        const qty = Math.min(20, printQtys[key]); // Cap preview count for UI performance
        const name = printItemNames[key] || item.ItemName;
        const price = printPrices[key] || "0";
        for (let i = 0; i < qty; i++) {
          selectedList.push({
            barcode: d.Barcode,
            name,
            price,
            id: d.Id || idx,
          });
        }
      }
    });

    // If nothing selected, render at least 1 sample card for visual setup
    if (selectedList.length === 0 && firstActiveVariant) {
      const name = `${item.ItemName}${firstActiveVariant.SizeName ? ` - ${firstActiveVariant.SizeName}` : ""}`;
      selectedList.push({
        barcode: firstActiveVariant.Barcode || "1234567890",
        name: name,
        price: String(firstActiveVariant.SalePrice || "0"),
        id: firstActiveVariant.Id || "sample",
      });
    }

    return selectedList;
  }, [item, variants, selectedVariants, printQtys, printItemNames, printPrices, firstActiveVariant]);

  // Scaled display values
  const scale = 2.4; // Screen preview scale factor (1mm = 2.4px)

  if (!isOpen || !item) return null;

  return (
    <>
      {/* Hidden container to render all SVGs via react-barcode so they can be captured during printing */}
      <div style={{ display: "none" }} aria-hidden="true">
        {variants.map((d, idx) => {
          const key = String(d.Id || idx);
          return (
            <div key={key} id={`hidden-bc-${d.Id || idx}`}>
              <Barcode
                value={d.Barcode || "0000000"}
                width={barcodeScale}
                height={barcodeHeight * 3.5}
                displayValue={showBarcodeText}
                fontSize={10}
                margin={0}
                background="transparent"
              />
            </div>
          );
        })}
        <div id="hidden-bc-sample">
          <Barcode
            value="1234567890"
            width={barcodeScale}
            height={barcodeHeight * 3.5}
            displayValue={showBarcodeText}
            fontSize={10}
            margin={0}
            background="transparent"
          />
        </div>
      </div>

      <Modal isOpen={isOpen} toggle={toggle} size="xl" className="barcode-setup-modal">
        <ModalHeader toggle={toggle} className="bg-primary text-white border-0 py-3">
          <div className="d-flex align-items-center">
            <i className="fa fa-barcode me-3 fs-4" />
            <div>
              <h5 className="modal-title mb-0">Universal Barcode Printer Dashboard</h5>
              <small className="opacity-75">{item.ItemName}</small>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-0 bg-light">
          <Row className="g-0">
            {/* Control Panel (Left Column) */}
            <Col lg="7" className="border-end bg-white" style={{ minHeight: "720px" }}>
              <div className="p-3 border-bottom bg-light">
                <Nav pills className="nav-primary justify-content-start gap-1">
                  <NavItem>
                    <NavLink
                      className={`py-2 px-3 fw-bold cursor-pointer ${activeTab === "variants" ? "active" : ""}`}
                      onClick={() => setActiveTab("variants")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa fa-list me-2" />
                      1. Quantities
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={`py-2 px-3 fw-bold cursor-pointer ${activeTab === "dimensions" ? "active" : ""}`}
                      onClick={() => setActiveTab("dimensions")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa fa-arrows me-2" />
                      2. Layout Settings
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={`py-2 px-3 fw-bold cursor-pointer ${activeTab === "design" ? "active" : ""}`}
                      onClick={() => setActiveTab("design")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa fa-paint-brush me-2" />
                      3. Design Fields
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={`py-2 px-3 fw-bold cursor-pointer ${activeTab === "tspl" ? "active" : ""}`}
                      onClick={() => setActiveTab("tspl")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa fa-code me-2" />
                      TSPL Script
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={`py-2 px-3 fw-bold cursor-pointer ${activeTab === "agent" ? "active" : ""}`}
                      onClick={() => setActiveTab("agent")}
                      style={{ cursor: "pointer" }}
                    >
                      <i className={`fa fa-laptop me-2 ${isAgentActive ? "text-success" : "text-danger"}`} />
                      4. Local Agent (.exe)
                      <span className={`ms-1 badge rounded-circle p-0 ${isAgentActive ? "bg-success" : "bg-danger"}`} style={{ width: "8px", height: "8px", display: "inline-block" }} />
                    </NavLink>
                  </NavItem>
                </Nav>
              </div>

              <div className="p-4" style={{ maxHeight: "620px", overflowY: "auto" }}>
                <TabContent activeTab={activeTab}>
                  {/* TAB 1: Variants Checklist */}
                  <TabPane tabId="variants">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0 text-secondary">Set Print Selection & Details</h6>
                      <div className="d-flex gap-2">
                        <Button color="outline-primary" size="sm" onClick={() => handleSelectAll(true)}>
                          Select All
                        </Button>
                        <Button color="outline-secondary" size="sm" onClick={() => handleSelectAll(false)}>
                          Deselect All
                        </Button>
                      </div>
                    </div>

                    <div className="table-responsive border rounded bg-white">
                      <Table hover striped className="align-middle mb-0 text-center">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "50px" }}>Print?</th>
                            <th>Variant Info</th>
                            <th>Barcode</th>
                            <th>Stock</th>
                            <th style={{ width: "90px" }}>Qty</th>
                            <th>Print Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-muted">
                                No variants configured for this item.
                              </td>
                            </tr>
                          ) : (
                            variants.map((v, idx) => {
                              const key = String(v.Id || idx);
                              const isSelected = selectedVariants[key] || false;
                              const qty = printQtys[key] || 0;
                              const price = printPrices[key] || "";

                              return (
                                <tr key={key} className={isSelected ? "table-light-primary" : ""}>
                                  <td>
                                    <Input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={!v.Barcode}
                                      onChange={(e) =>
                                        setSelectedVariants((prev) => ({
                                          ...prev,
                                          [key]: e.target.checked,
                                        }))
                                      }
                                    />
                                  </td>
                                  <td className="text-start">
                                    <div className="fw-bold text-dark">{v.SizeName || "Standard"}</div>
                                    <small className="text-muted">Sale Price: ₹{v.SalePrice || "0"}</small>
                                  </td>
                                  <td>
                                    {v.Barcode ? (
                                      <span className="badge bg-secondary font-monospace p-2">
                                        {v.Barcode}
                                      </span>
                                    ) : (
                                      <span className="text-danger small">No Barcode</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-dark border">
                                      {v.OpeningStock || "0"}
                                    </span>
                                  </td>
                                  <td>
                                    <Input
                                      type="number"
                                      min="0"
                                      disabled={!isSelected}
                                      className="form-control-sm text-center px-1"
                                      value={qty || ""}
                                      onChange={(e) =>
                                        setPrintQtys((prev) => ({
                                          ...prev,
                                          [key]: parseInt(e.target.value) || 0,
                                        }))
                                      }
                                      style={{ height: "30px" }}
                                    />
                                  </td>
                                  <td>
                                    <Input
                                      type="text"
                                      disabled={!isSelected}
                                      className="form-control-sm text-center"
                                      value={price}
                                      onChange={(e) =>
                                        setPrintPrices((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }))
                                      }
                                      style={{ height: "30px", width: "90px" }}
                                      placeholder="MRP"
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </TabPane>

                  {/* TAB 2: Layout & Paper Settings */}
                  <TabPane tabId="dimensions">
                    <Row className="mb-3 align-items-center">
                      <Col md="6">
                        <h6 className="fw-bold mb-0 text-secondary">Layout & Paper Setup</h6>
                      </Col>
                      <Col md="6" className="text-end">
                        <div className="d-inline-flex gap-2 align-items-center border rounded p-1 bg-light">
                          <Label className="mb-0 small fw-bold text-muted px-2">Unit:</Label>
                          <Button
                            color={unit === "in" ? "primary" : "light"}
                            size="xs"
                            onClick={() => setUnit("in")}
                            className="py-1 px-2 border-0"
                          >
                            Inches
                          </Button>
                          <Button
                            color={unit === "mm" ? "primary" : "light"}
                            size="xs"
                            onClick={() => setUnit("mm")}
                            className="py-1 px-2 border-0"
                          >
                            mm
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    {/* Printer Mode Option */}
                    <Row className="g-3 mb-3">
                      <Col md="6">
                        <FormGroup>
                          <Label className="fw-bold small text-muted">Page Feed Type</Label>
                          <Input
                            type="select"
                            value={printerMode}
                            onChange={(e) => setPrinterMode(e.target.value as "roll" | "sheet")}
                          >
                            <option value="roll">Roll Feed (Barcode/Thermal Printer)</option>
                            <option value="sheet">Sheet Feed (A4/Letter Paper Sheet)</option>
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col md="6">
                        <FormGroup>
                          <Label className="fw-bold small text-muted">Page Orientation</Label>
                          <Input
                            type="select"
                            value={orientation}
                            onChange={(e) => setOrientation(e.target.value as any)}
                          >
                            <option value="auto">Auto-detect</option>
                            <option value="portrait">Portrait (Vertical)</option>
                            <option value="landscape">Landscape (Horizontal)</option>
                          </Input>
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Preset Selector */}
                    <FormGroup>
                      <Label className="fw-bold small text-muted">Paper / Label Preset</Label>
                      <Input
                        type="select"
                        value={labelPreset}
                        onChange={(e) => handlePresetChange(e.target.value)}
                      >
                        <optgroup label="Roll Feed Presets (Inches)">
                          <option value="4x6_single">4&quot; x 6&quot; Single Label Roll</option>
                          <option value="4x4_single">4&quot; x 4&quot; Single Label Roll</option>
                          <option value="2x4_single">2&quot; x 4&quot; Single Label Roll</option>
                          <option value="4x2_single">4&quot; x 2&quot; Single Label Roll</option>
                          <option value="3x2_single">3&quot; x 2&quot; Single Label Roll</option>
                          <option value="2x1_single">2&quot; x 1&quot; Single Label Roll</option>
                        </optgroup>
                        <optgroup label="Roll Feed Presets (mm)">
                          <option value="50x25_single">50mm x 25mm Single Label</option>
                          <option value="38x25_single">38mm x 25mm Single Label</option>
                          <option value="50x25_double">50mm x 25mm Double Label (2 Across)</option>
                        </optgroup>
                        <optgroup label="Sheet Feed Presets (A4 Pages)">
                          <option value="A4_2x5_sheet">A4 Sheet (2 Columns x 5 Rows)</option>
                          <option value="A4_3x8_sheet">A4 Sheet (3 Columns x 8 Rows)</option>
                        </optgroup>
                        <option value="custom">Custom Configuration (Sliders)</option>
                      </Input>
                    </FormGroup>

                    <hr className="my-3" />

                    {/* Sheet Feed Settings */}
                    {printerMode === "sheet" && (
                      <div className="border rounded p-3 mb-3 bg-light-subtle">
                        <h6 className="fw-bold text-dark mb-2">Paper Sheet Margins & Sizes</h6>
                        <Row className="g-2">
                          <Col md="4">
                            <FormGroup>
                              <Label className="small text-muted">Sheet Size</Label>
                              <Input
                                type="select"
                                value={sheetType}
                                onChange={(e) => handleSheetTypeChange(e.target.value as any)}
                              >
                                <option value="A4">A4 (210 x 297 mm)</option>
                                <option value="Letter">Letter (8.5&quot; x 11&quot;)</option>
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label className="small text-muted">Columns</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={columns}
                                onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label className="small text-muted">Rows per Sheet</Label>
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={rowsPerSheet}
                                onChange={(e) => setRowsPerSheet(parseInt(e.target.value) || 1)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row className="g-2">
                          <Col md="3">
                            <FormGroup>
                              <Label className="small text-muted">Top Marg</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={displayVal(pageMarginTop)}
                                onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setPageMarginTop)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="3">
                            <FormGroup>
                              <Label className="small text-muted">Bottom Marg</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={displayVal(pageMarginBottom)}
                                onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setPageMarginBottom)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="3">
                            <FormGroup>
                              <Label className="small text-muted">Left Marg</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={displayVal(pageMarginLeft)}
                                onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setPageMarginLeft)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="3">
                            <FormGroup>
                              <Label className="small text-muted">Right Marg</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={displayVal(pageMarginRight)}
                                onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setPageMarginRight)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {/* Label Dimension Controls */}
                    <div className="border rounded p-3 bg-light-subtle">
                      <h6 className="fw-bold text-dark mb-2">Individual Label Dimensions</h6>
                      <Row className="g-3">
                        <Col md="6">
                          <FormGroup>
                            <Label className="fw-bold small text-muted">Label Width ({displayVal(labelWidth)} {unit})</Label>
                            <Input
                              type="range"
                              min={unit === "in" ? "0.5" : "15"}
                              max={unit === "in" ? "5.0" : "120"}
                              step={unit === "in" ? "0.05" : "1"}
                              value={displayVal(labelWidth)}
                              onChange={(e) => {
                                handleValChange(parseFloat(e.target.value), setLabelWidth);
                                setLabelPreset("custom");
                              }}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label className="fw-bold small text-muted">Label Height ({displayVal(labelHeight)} {unit})</Label>
                            <Input
                              type="range"
                              min={unit === "in" ? "0.5" : "15"}
                              max={unit === "in" ? "8.0" : "180"}
                              step={unit === "in" ? "0.05" : "1"}
                              value={displayVal(labelHeight)}
                              onChange={(e) => {
                                handleValChange(parseFloat(e.target.value), setLabelHeight);
                                setLabelPreset("custom");
                              }}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      {printerMode === "roll" && (
                        <Row className="g-2">
                          <Col md="6">
                            <FormGroup>
                              <Label className="small text-muted">Columns Across Roll</Label>
                              <Input
                                type="select"
                                value={columns}
                                onChange={(e) => {
                                  setColumns(parseInt(e.target.value));
                                  setLabelPreset("custom");
                                }}
                              >
                                <option value={1}>1 Column</option>
                                <option value={2}>2 Columns</option>
                                <option value={3}>3 Columns</option>
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label className="small text-muted">Col Gap ({displayVal(columnGap)} {unit})</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.05"
                                value={displayVal(columnGap)}
                                disabled={columns === 1}
                                onChange={(e) => {
                                  handleValChange(parseFloat(e.target.value) || 0, setColumnGap);
                                  setLabelPreset("custom");
                                }}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      )}

                      <Row className="g-2">
                        <Col md="6">
                          <FormGroup>
                            <Label className="small text-muted">Label Row Gap ({displayVal(rowGap)} {unit})</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.05"
                              value={displayVal(rowGap)}
                              onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setRowGap)}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <h6 className="fw-bold mt-3 mb-2 text-dark small">Inner Content Padding (Margins)</h6>
                      <Row className="g-2">
                        <Col md="3">
                          <FormGroup>
                            <Label className="small text-muted">Top</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.05"
                              value={displayVal(marginTop)}
                              onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setMarginTop)}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label className="small text-muted">Bottom</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.05"
                              value={displayVal(marginBottom)}
                              onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setMarginBottom)}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label className="small text-muted">Left</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.05"
                              value={displayVal(marginLeft)}
                              onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setMarginLeft)}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label className="small text-muted">Right</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.05"
                              value={displayVal(marginRight)}
                              onChange={(e) => handleValChange(parseFloat(e.target.value) || 0, setMarginRight)}
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </div>
                  </TabPane>

                  {/* TAB 3: Design Customizer */}
                  <TabPane tabId="design">
                    <h6 className="fw-bold mb-3 text-secondary">Toggle & Resize Label Fields</h6>

                    {/* Logo config */}
                    <div className="border rounded p-3 mb-3 bg-light-subtle">
                      <FormGroup check className="mb-2">
                        <Input
                          type="checkbox"
                          id="chkLogo"
                          checked={showLogo}
                          onChange={(e) => setShowLogo(e.target.checked)}
                        />
                        <Label check for="chkLogo" className="fw-bold text-dark">
                          Show Company Logo
                        </Label>
                      </FormGroup>
                      {showLogo && (
                        <FormGroup className="mb-0 mt-2">
                          <Label className="small text-muted">Logo Height ({displayVal(logoHeight)} {unit})</Label>
                          <Input
                            type="range"
                            min={unit === "in" ? "0.05" : "1"}
                            max={unit === "in" ? "1.0" : "25"}
                            step={unit === "in" ? "0.05" : "0.5"}
                            value={displayVal(logoHeight)}
                            onChange={(e) => handleValChange(parseFloat(e.target.value), setLogoHeight)}
                          />
                        </FormGroup>
                      )}
                    </div>

                    {/* Company Name config */}
                    <div className="border rounded p-3 mb-3 bg-light-subtle">
                      <FormGroup check className="mb-2">
                        <Input
                          type="checkbox"
                          id="chkFirm"
                          checked={showFirmName}
                          onChange={(e) => setShowFirmName(e.target.checked)}
                        />
                        <Label check for="chkFirm" className="fw-bold text-dark">
                          Show Company Name
                        </Label>
                      </FormGroup>
                      {showFirmName && (
                        <Row className="g-2 mt-2">
                          <Col md="8">
                            <Label className="small text-muted">Firm Display Name</Label>
                            <Input
                              type="text"
                              value={customFirmName}
                              onChange={(e) => setCustomFirmName(e.target.value)}
                            />
                          </Col>
                          <Col md="4">
                            <Label className="small text-muted">Font Size ({firmFontSize}px)</Label>
                            <Input
                              type="number"
                              min="6"
                              max="24"
                              value={firmFontSize}
                              onChange={(e) => setFirmFontSize(parseInt(e.target.value) || 6)}
                            />
                          </Col>
                        </Row>
                      )}
                    </div>

                    {/* Item Name config */}
                    <div className="border rounded p-3 mb-3 bg-light-subtle">
                      <FormGroup check className="mb-2">
                        <Input
                          type="checkbox"
                          id="chkItemName"
                          checked={showItemName}
                          onChange={(e) => setShowItemName(e.target.checked)}
                        />
                        <Label check for="chkItemName" className="fw-bold text-dark">
                          Show Product Item Name
                        </Label>
                      </FormGroup>
                      {showItemName && (
                        <Row className="g-2 mt-2">
                          <Col md="6">
                            <Label className="small text-muted">Truncate Limit (characters)</Label>
                            <Input
                              type="number"
                              min="10"
                              max="60"
                              value={itemNameMaxChars}
                              onChange={(e) => setItemNameMaxChars(parseInt(e.target.value) || 10)}
                            />
                          </Col>
                          <Col md="6">
                            <Label className="small text-muted">Font Size ({itemNameFontSize}px)</Label>
                            <Input
                              type="number"
                              min="6"
                              max="24"
                              value={itemNameFontSize}
                              onChange={(e) => setItemNameFontSize(parseInt(e.target.value) || 6)}
                            />
                          </Col>
                        </Row>
                      )}
                    </div>

                    {/* Price config */}
                    <div className="border rounded p-3 mb-3 bg-light-subtle">
                      <FormGroup check className="mb-2">
                        <Input
                          type="checkbox"
                          id="chkPrice"
                          checked={showPrice}
                          onChange={(e) => setShowPrice(e.target.checked)}
                        />
                        <Label check for="chkPrice" className="fw-bold text-dark">
                          Show Price (MRP / Code Line)
                        </Label>
                      </FormGroup>
                      {showPrice && (
                        <Row className="g-2 mt-2">
                          <Col md="7">
                            <Label className="small text-muted">Prefix (e.g. MRP: ₹)</Label>
                            <Input
                              type="text"
                              value={pricePrefix}
                              onChange={(e) => setPricePrefix(e.target.value)}
                            />
                          </Col>
                          <Col md="5">
                            <Label className="small text-muted">Font Size ({priceFontSize}px)</Label>
                            <Input
                              type="number"
                              min="6"
                              max="24"
                              value={priceFontSize}
                              onChange={(e) => setPriceFontSize(parseInt(e.target.value) || 6)}
                            />
                          </Col>
                        </Row>
                      )}
                    </div>

                    {/* Barcode settings */}
                    <div className="border rounded p-3 bg-light-subtle">
                      <h6 className="fw-bold text-dark mb-2">Barcode Symbology & Dimension</h6>
                      <Row className="g-2">
                        <Col md="4">
                          <Label className="small text-muted">Height ({displayVal(barcodeHeight)} {unit})</Label>
                          <Input
                            type="range"
                            min={unit === "in" ? "0.2" : "5"}
                            max={unit === "in" ? "2.5" : "60"}
                            step={unit === "in" ? "0.05" : "0.5"}
                            value={displayVal(barcodeHeight)}
                            onChange={(e) => handleValChange(parseFloat(e.target.value), setBarcodeHeight)}
                          />
                        </Col>
                        <Col md="4">
                          <Label className="small text-muted">Width Scale ({barcodeScale})</Label>
                          <Input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            value={barcodeScale}
                            onChange={(e) => setBarcodeScale(parseFloat(e.target.value))}
                          />
                        </Col>
                        <Col md="4">
                          <FormGroup check className="mt-4 pt-1">
                            <Input
                              type="checkbox"
                              id="chkBarText"
                              checked={showBarcodeText}
                              onChange={(e) => setShowBarcodeText(e.target.checked)}
                            />
                            <Label check for="chkBarText" className="small fw-bold text-dark">
                              Value Text
                            </Label>
                          </FormGroup>
                        </Col>
                      </Row>
                    </div>
                  </TabPane>

                  {/* TAB 4: TSPL command export */}
                  <TabPane tabId="tspl">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold mb-0 text-secondary">TSPL Commands (TVS Electronics)</h6>
                        <small className="text-muted">For direct USB raw text printing</small>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Label className="mb-0 small text-muted me-1">DPI:</Label>
                        <Input
                          type="select"
                          bsSize="sm"
                          value={dpi}
                          onChange={(e) => setDpi(parseInt(e.target.value))}
                          style={{ width: "100px" }}
                        >
                          <option value={203}>203 DPI</option>
                          <option value={300}>300 DPI</option>
                        </Input>
                      </div>
                    </div>

                    <FormGroup>
                      <Input
                        type="textarea"
                        value={tsplCode}
                        readOnly
                        rows={14}
                        className="font-monospace text-dark bg-light border p-3"
                        style={{ fontSize: "12px", whiteSpace: "pre", overflowX: "auto" }}
                      />
                    </FormGroup>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <Button color="secondary" outline onClick={handleCopyTspl}>
                        <i className="fa fa-copy me-2" />
                        Copy Command Script
                      </Button>
                      <Button color="success" onClick={handleDownloadTspl}>
                        <i className="fa fa-download me-2" />
                        Download PRN File
                      </Button>
                    </div>
                  </TabPane>

                  {/* TAB 5: Local Companion Print Agent (.exe) */}
                  <TabPane tabId="agent">
                    <div className="border rounded p-3 mb-4 text-center">
                      <h6 className="fw-bold mb-3">Local Companion Print Agent status:</h6>
                      {isAgentActive ? (
                        <div className="alert alert-success border-success py-3 px-2 mb-0 d-flex align-items-center justify-content-center gap-2">
                          <i className="fa fa-check-circle fa-lg text-success" />
                          <div>
                            <strong className="text-success d-block">AGENT ONLINE & ACTIVE</strong>
                            <small className="text-secondary">Browser has established link with local companion agent.</small>
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-danger border-danger py-3 px-2 mb-0 d-flex align-items-center justify-content-center gap-2">
                          <i className="fa fa-exclamation-triangle fa-lg text-danger" />
                          <div>
                            <strong className="text-danger d-block">AGENT OFFLINE</strong>
                            <small className="text-secondary">Make sure LocalPrintAgent.exe is running on this computer.</small>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border rounded p-3 mb-4 bg-light-subtle">
                      <h6 className="fw-bold text-dark mb-3">1-Click Direct Printer Settings</h6>
                      
                      <FormGroup className="mb-2">
                        <Label className="fw-bold text-dark small">Select Printer:</Label>
                        <div className="d-flex gap-2 align-items-start">
                          <div className="flex-fill">
                            {isAgentActive && availablePrinters.length > 0 ? (
                              <>
                                <Input
                                  type="select"
                                  value={printerName}
                                  onChange={(e) => setPrinterName(e.target.value)}
                                  className="text-dark fw-bold border-secondary-subtle"
                                >
                                  {availablePrinters.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                </Input>
                                <small className="text-success d-block mt-1" style={{ fontSize: "11px" }}>
                                  <i className="fa fa-check-circle me-1" />
                                  {availablePrinters.length} printer(s) detected from Windows. Selected: <strong>{printerName}</strong>
                                </small>
                              </>
                            ) : (
                              <>
                                <Input
                                  type="text"
                                  value={printerName}
                                  onChange={(e) => setPrinterName(e.target.value)}
                                  placeholder="e.g. TVS LP 46 NEO"
                                  className="text-dark fw-bold border-secondary-subtle"
                                />
                                <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
                                  {isAgentActive
                                    ? "No printers found. Enter name manually — must EXACTLY match Windows Control Panel."
                                    : "Agent offline. Enter printer name manually (e.g. \"TVS LP 46 NEO\")."}
                                </small>
                              </>
                            )}
                          </div>
                          <Button
                            color="primary"
                            outline
                            size="sm"
                            className="px-2 py-1 mt-0"
                            style={{ whiteSpace: "nowrap", minWidth: "110px" }}
                            onClick={fetchPrinters}
                            disabled={!isAgentActive || isFetchingPrinters}
                            title={!isAgentActive ? "Start the Local Print Agent first" : "Fetch installed printers from Windows"}
                          >
                            {isFetchingPrinters
                              ? <><i className="fa fa-spinner fa-spin me-1" />Loading...</>
                              : <><i className="fa fa-print me-1" />Get Printers</>}
                          </Button>
                        </div>
                      </FormGroup>

                      {/* ── Printer Capabilities Panel ─────────────────── */}
                      {isFetchingPrinterInfo && (
                        <div className="text-center py-3 text-muted">
                          <i className="fa fa-spinner fa-spin me-2" />
                          Fetching printer capabilities from Windows...
                        </div>
                      )}

                      {!isFetchingPrinterInfo && printerInfo && (
                        <div className="mb-3">
                          {/* Paper Sizes */}
                          <Label className="fw-bold text-dark small d-block mb-2">
                            <i className="fa fa-file-o me-1 text-primary" />
                            Select Paper / Label Size:
                          </Label>
                          {printerInfo.paperSizes.length === 0 ? (
                            <small className="text-warning">
                              No paper sizes reported by this printer. Configure label size manually in the Layout tab.
                            </small>
                          ) : (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                                gap: "8px",
                                maxHeight: "220px",
                                overflowY: "auto",
                              }}
                            >
                              {printerInfo.paperSizes.map((paper) => {
                                const isSelected = selectedPaperSize === paper.name;
                                return (
                                  <div
                                    key={paper.name}
                                    onClick={() => {
                                      setSelectedPaperSize(paper.name);
                                      applyPaperSize(paper, dpi);
                                    }}
                                    style={{
                                      border: isSelected
                                        ? "2px solid #0d6efd"
                                        : "1.5px solid #dee2e6",
                                      borderRadius: "8px",
                                      padding: "8px 6px",
                                      cursor: "pointer",
                                      textAlign: "center",
                                      background: isSelected ? "#e7f1ff" : "#fff",
                                      transition: "all 0.15s",
                                      boxShadow: isSelected
                                        ? "0 0 0 3px rgba(13,110,253,0.15)"
                                        : "none",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 700,
                                        fontSize: "11px",
                                        color: isSelected ? "#0d6efd" : "#333",
                                        lineHeight: 1.2,
                                        marginBottom: "4px",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {paper.name}
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#6c757d" }}>
                                      {paper.widthIn}" × {paper.heightIn}"
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#6c757d" }}>
                                      {paper.widthMm} × {paper.heightMm} mm
                                    </div>
                                    {isSelected && (
                                      <i
                                        className="fa fa-check-circle text-primary mt-1"
                                        style={{ fontSize: "14px" }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* DPI Selector */}
                          {printerInfo.resolutions.length > 0 && (
                            <FormGroup className="mt-3 mb-0">
                              <Label className="fw-bold text-dark small">
                                <i className="fa fa-tachometer me-1 text-primary" />
                                Print Resolution (DPI):
                              </Label>
                              <div className="d-flex gap-2 flex-wrap">
                                {printerInfo.resolutions.map((r) => (
                                  <Button
                                    key={r}
                                    size="sm"
                                    color={dpi === r ? "primary" : "outline-secondary"}
                                    onClick={() => {
                                      setDpi(r);
                                      const selPaper = printerInfo.paperSizes.find(
                                        (p) => p.name === selectedPaperSize
                                      );
                                      if (selPaper) applyPaperSize(selPaper, r);
                                    }}
                                    style={{ minWidth: "72px" }}
                                  >
                                    {r} DPI
                                    {r === printerInfo.defaultDpi && (
                                      <span
                                        className="ms-1"
                                        style={{ fontSize: "9px", opacity: 0.75 }}
                                      >
                                        (default)
                                      </span>
                                    )}
                                  </Button>
                                ))}
                              </div>
                            </FormGroup>
                          )}
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-2">
                        <Button color="secondary" outline size="sm" className="flex-fill py-2" onClick={checkAgentStatus}>
                          <i className="fa fa-refresh me-2" />
                          Refresh Status
                        </Button>
                        <a href="/print-agent/LocalPrintAgent.exe" download className="btn btn-warning btn-sm flex-fill py-2 text-dark fw-bold">
                          <i className="fa fa-download me-2" />
                          Download Agent (.exe)
                        </a>
                      </div>
                    </div>


                    <div className="border rounded p-3 bg-light" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      <h6 className="fw-bold text-secondary mb-2">How to Setup Direct Printing:</h6>
                      <ol className="ps-3 mb-0 text-muted">
                        <li className="mb-2">
                          Click the <strong>Download Agent (.exe)</strong> button above to download the companion utility file.
                        </li>
                        <li className="mb-2">
                          Double-click <strong>LocalPrintAgent.exe</strong> on your Windows machine to run it. (A black window will open indicating that the agent has started).
                        </li>
                        <li className="mb-2">
                          Ensure your barcode printer is plugged in via USB and turned on.
                        </li>
                        <li>
                          Select your printer from the dropdown — paper sizes & DPI will be auto-loaded. Select the correct label size, then click <strong>Print Direct (via Agent)</strong>.
                        </li>
                      </ol>
                    </div>
                  </TabPane>

                </TabContent>
              </div>
            </Col>

            {/* Live Visual Preview (Right Column) */}
            <Col lg="5" className="bg-dark p-4 d-flex flex-column align-items-center justify-content-between border-start" style={{ overflowY: "auto", maxHeight: "720px" }}>
              <div className="w-100 text-center mb-3">
                <span className="badge bg-light text-dark px-3 py-2 fs-6 border">
                  <i className="fa fa-eye me-2 text-primary" />
                  Live print layout preview
                </span>
                <p className="text-white-50 small mt-2">
                  Unit mode: {unit === "in" ? "Inches" : "Millimeters"}. Mode: {printerMode === "roll" ? "Roll Feed" : "Grid Sheet"}.
                </p>
              </div>

              {/* Responsive scaling container */}
              <div
                className="w-100 d-flex flex-column align-items-center py-4 border border-secondary border-dashed rounded text-center position-relative"
                style={{
                  maxHeight: "460px",
                  overflowY: "auto",
                  backgroundColor: "#2b3035",
                }}
              >
                {/* 1. Sheet Layout Preview */}
                {printerMode === "sheet" ? (
                  <div
                    className="bg-light-subtle p-2 position-relative border border-secondary"
                    style={{
                      // Scale representation of sheet (A4 is 210x297, letter is 216x279)
                      // Scale 1mm = 1.3px to fit screen beautifully
                      width: `${sheetWidth * 1.3}px`,
                      minHeight: `${sheetHeight * 1.3}px`,
                      paddingTop: `${pageMarginTop * 1.3}px`,
                      paddingBottom: `${pageMarginBottom * 1.3}px`,
                      paddingLeft: `${pageMarginLeft * 1.3}px`,
                      paddingRight: `${pageMarginRight * 1.3}px`,
                      boxSizing: "border-box",
                      backgroundColor: "#fff",
                      boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div
                      className="d-grid"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, ${labelWidth * 1.3}px)`,
                        gridTemplateRows: `repeat(${rowsPerSheet}, ${labelHeight * 1.3}px)`,
                        gap: `${rowGap * 1.3}px ${columnGap * 1.3}px`,
                        justifyContent: "center",
                        alignContent: "start",
                      }}
                    >
                      {Array.from({ length: columns * rowsPerSheet }).map((_, idx) => {
                        const lbl = previewLabels[idx % previewLabels.length];
                        return (
                          <div
                            key={idx}
                            className="bg-white border text-dark position-relative d-flex flex-column align-items-center justify-content-between text-center overflow-hidden"
                            style={{
                              width: `${labelWidth * 1.3}px`,
                              height: `${labelHeight * 1.3}px`,
                              padding: `${marginTop * 1.3}px ${marginRight * 1.3}px ${marginBottom * 1.3}px ${marginLeft * 1.3}px`,
                              boxSizing: "border-box",
                              fontSize: "7px",
                              lineHeight: "1.1",
                            }}
                          >
                            {/* Logo + Name */}
                            <div className="d-flex align-items-center justify-content-center gap-1 w-100 overflow-hidden">
                              {showLogo && (
                                <img
                                  src="/assets/images/Wedding-logo.png"
                                  alt="logo"
                                  style={{ height: `${logoHeight * 1.3}px`, width: "auto" }}
                                />
                              )}
                              {showFirmName && (
                                <span className="fw-bold" style={{ fontSize: `${firmFontSize * 0.7}px` }}>
                                  {customFirmName}
                                </span>
                              )}
                            </div>
                            {/* Item Name */}
                            {showItemName && (
                              <div className="text-truncate w-100" style={{ fontSize: `${itemNameFontSize * 0.7}px` }}>
                                {lbl?.name || "Sample Item Name"}
                              </div>
                            )}
                            {/* Barcode */}
                            <div className="d-flex align-items-center justify-content-center w-100 overflow-hidden" style={{ height: `${barcodeHeight * 1.3}px` }}>
                              <Barcode
                                value={lbl?.barcode || "0000000"}
                                width={barcodeScale * 0.6}
                                height={barcodeHeight * 1.2}
                                displayValue={showBarcodeText}
                                fontSize={6}
                                margin={0}
                                background="transparent"
                              />
                            </div>
                            {/* Price */}
                            {showPrice && (
                              <div className="fw-bold w-100 text-truncate" style={{ fontSize: `${priceFontSize * 0.7}px` }}>
                                {pricePrefix}
                                {lbl?.price || "0.00"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 2. Roll Feed Preview */
                  <div
                    className="d-flex flex-wrap align-content-start justify-content-center"
                    style={{
                      width: `${(labelWidth * columns + columnGap * (columns - 1)) * scale}px`,
                      gap: `${rowGap * scale}px ${columnGap * scale}px`,
                    }}
                  >
                    {previewLabels.map((lbl, idx) => (
                      <div
                        key={idx}
                        className="bg-white border text-dark position-relative d-flex flex-column align-items-center justify-content-between text-center overflow-hidden"
                        style={{
                          width: `${labelWidth * scale}px`,
                          height: `${labelHeight * scale}px`,
                          padding: `${marginTop * scale}px ${marginRight * scale}px ${marginBottom * scale}px ${marginLeft * scale}px`,
                          boxSizing: "border-box",
                          borderRadius: "2px",
                        }}
                      >
                        {/* Logo and Firm Name row */}
                        <div
                          className="d-flex align-items-center justify-content-center gap-1 w-100"
                          style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                        >
                          {showLogo && (
                            <img
                              src="/assets/images/Wedding-logo.png"
                              alt="Logo"
                              style={{ height: `${logoHeight * scale}px`, width: "auto" }}
                            />
                          )}
                          {showFirmName && (
                            <span
                              className="fw-bold"
                              style={{
                                fontSize: `${firmFontSize}px`,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {customFirmName}
                            </span>
                          )}
                        </div>

                        {/* Item/Product Name */}
                        {showItemName && (
                          <div
                            style={{
                              fontSize: `${itemNameFontSize}px`,
                              width: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: "1.1",
                            }}
                          >
                            {lbl.name.length > itemNameMaxChars
                              ? lbl.name.substring(0, itemNameMaxChars) + "..."
                              : lbl.name}
                          </div>
                        )}

                        {/* Barcode Render */}
                        <div
                          className="d-flex align-items-center justify-content-center w-100"
                          style={{ height: `${barcodeHeight * scale}px`, overflow: "hidden" }}
                        >
                          <Barcode
                            value={lbl.barcode}
                            width={barcodeScale}
                            height={barcodeHeight * scale}
                            displayValue={showBarcodeText}
                            fontSize={9}
                            margin={0}
                            background="transparent"
                          />
                        </div>

                        {/* Price Code Line */}
                        {showPrice && (
                          <div
                            className="fw-bold w-100 text-truncate"
                            style={{ fontSize: `${priceFontSize}px`, lineHeight: "1.1" }}
                          >
                            {pricePrefix}
                            {lbl.price}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="w-100 mt-4 px-3 d-flex flex-column gap-2">
                <Button color="primary" size="lg" className="w-100 py-3 fw-bold" onClick={handleWebPrint}>
                  <i className="fa fa-print me-2" />
                  Calibrated Web Print Preview
                </Button>

                {isAgentActive ? (
                  <Button color="success" size="lg" className="w-100 py-3 fw-bold" onClick={handleLocalAgentPrint}>
                    <i className="fa fa-check-circle me-2" />
                    Print Direct (via Local Agent)
                  </Button>
                ) : (
                  <Button color="warning" size="lg" className="w-100 py-3 fw-bold text-dark" onClick={handleLocalAgentPrint}>
                    <i className="fa fa-exclamation-triangle me-2" />
                    Print Direct (via Agent Offline)
                  </Button>
                )}

                {!isAgentActive && (
                  <div className="text-center my-1">
                    <a href="/print-agent/LocalPrintAgent.exe" download className="text-warning small fw-bold">
                      <i className="fa fa-download me-1" /> Download Print Agent (.exe)
                    </a>
                  </div>
                )}

                {/* Legacy/Fallback Options */}
                <details className="w-100 mt-2 text-center text-white-50 small">
                  <summary className="cursor-pointer text-white-50" style={{ cursor: "pointer", userSelect: "none" }}>
                    Show alternative direct print channels (WebUSB/Serial)
                  </summary>
                  <div className="d-flex flex-column gap-2 mt-2 p-2 border border-secondary rounded bg-dark">
                    <Button color="success" outline size="sm" className="w-100 text-white border-secondary-subtle" onClick={handleDirectSerialPrint}>
                      <i className="fa fa-refresh me-2" />
                      Print Direct via COM/Serial Port
                    </Button>

                    <Button color="info" outline size="sm" className="w-100 text-white border-secondary-subtle" onClick={handleDirectUsbPrint}>
                      <i className="fa fa-plug me-2" />
                      Print Direct via USB (Zadig)
                    </Button>
                  </div>
                </details>

                <div className="text-white-50 small text-center mt-2">
                  Total Print Queue: {printQueue.length} Labels (
                  {printerMode === "roll"
                    ? `${Math.ceil(printQueue.length / columns)} Grid Rows`
                    : `${Math.ceil(printQueue.length / (columns * rowsPerSheet))} Sheets`}
                  )
                </div>
              </div>
            </Col>
          </Row>
        </ModalBody>

        <ModalFooter className="bg-light border-top justify-content-end p-3">
          <Button color="secondary" outline onClick={toggle} className="px-4">
            Close Panel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
