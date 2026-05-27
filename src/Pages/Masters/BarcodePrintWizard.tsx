import React, { useEffect, useState, useRef } from "react";
import Barcode from "react-barcode";
import { toast } from "react-toastify";

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
}
interface PaperSize {
  name: string; widthMm: number; heightMm: number; widthIn: number; heightIn: number;
}
interface PrinterInfo {
  paperSizes: PaperSize[]; resolutions: number[];
  defaultPaperName: string; defaultWidthMm: number; defaultHeightMm: number;
  defaultDpi: number; isLandscape: boolean;
}

const AGENT = "http://127.0.0.1:9187";

function parseVariants(item: Item): Variant[] {
  try {
    if (typeof item.DesignDetails === "string") return JSON.parse(item.DesignDetails || "[]");
    if (Array.isArray(item.DesignDetails)) return item.DesignDetails;
  } catch { }
  return [];
}

export default function BarcodePrintWizard() {
  const [activeTab, setActiveTab] = useState("print"); // "print", "hardware", "designer"
  const [item, setItem] = useState<Item | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Step 2 - printer
  const [agentActive, setAgentActive] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [printerName, setPrinterName] = useState("");
  const [printerInfo, setPrinterInfo] = useState<PrinterInfo | null>(null);
  const [selectedPaper, setSelectedPaper] = useState("");
  const [dpi, setDpi] = useState(203);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Layout (mm)
  const [labelW, setLabelW] = useState(104.2);
  const [labelH, setLabelH] = useState(152.4);
  const [marginT, setMarginT] = useState(2);
  const [marginL, setMarginL] = useState(3.1);
  const [bcH, setBcH] = useState(5);
  const [firmName, setFirmName] = useState("FIRM NAME");
  const [showFirm, setShowFirm] = useState(true);
  const [showItem, setShowItem] = useState(true);
  const [showBcText, setShowBcText] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [columns, setColumns] = useState(2);   // labels per row
  const [colGap, setColGap] = useState(2);     // gap between columns in mm
  const [lineSpacing, setLineSpacing] = useState(1); // vertical gap between text elements (mm)
  const [bcTextSize, setBcTextSize] = useState(1); // size multiplier for barcode text

  // Step 3 preview
  const previewRef = useRef<HTMLDivElement>(null);
  const hasSavedSettings = useRef(false);

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem("barcodeWizardSettings");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.columns) setColumns(s.columns);
        if (s.colGap !== undefined) setColGap(s.colGap);
        if (s.lineSpacing !== undefined) setLineSpacing(s.lineSpacing);
        if (s.bcTextSize !== undefined) setBcTextSize(s.bcTextSize);
        if (s.labelW !== undefined) setLabelW(s.labelW);
        if (s.labelH !== undefined) setLabelH(s.labelH);
        if (s.marginT !== undefined) setMarginT(s.marginT);
        if (s.marginL !== undefined) setMarginL(s.marginL);
        if (s.bcH !== undefined) setBcH(s.bcH);
        hasSavedSettings.current = true;
      } catch (e) {}
    }
  }, []);

  // Save settings on change
  useEffect(() => {
    if (labelW > 0 && labelH > 0) {
      const settings = {
        columns, colGap, lineSpacing, bcTextSize, labelW, labelH, marginT, marginL, bcH
      };
      localStorage.setItem("barcodeWizardSettings", JSON.stringify(settings));
      
      // Save settings specifically keyed to this label size
      const paperKey = `${labelW}x${labelH}`;
      localStorage.setItem(`barcodeWizardSettings_${paperKey}`, JSON.stringify(settings));
    }
  }, [columns, colGap, lineSpacing, bcTextSize, labelW, labelH, marginT, marginL, bcH]);

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
    const fn = sessionStorage.getItem("barcodePrintFirmName") || "FIRM NAME";
    setFirmName(fn);
    if (!raw) { toast.error("No item data found. Please go back and try again."); return; }
    const parsed: Item = JSON.parse(raw);
    setItem(parsed);
    const v = parseVariants(parsed);
    setVariants(v);
    const initQ: Record<string, number> = {};
    const initP: Record<string, string> = {};
    const initS: Record<string, boolean> = {};
    v.forEach((d, i) => {
      const k = String(d.Id || i);
      initQ[k] = 1;
      initP[k] = String(d.SalePrice || "0");
      initS[k] = !!d.Barcode;
    });
    setQuantities(initQ); setPrices(initP); setSelected(initS);
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
        const def = d.defaultPrinter || list[0] || "";
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
        const def = d.paperSizes.find(p => p.name === d.defaultPaperName) || d.paperSizes[0];
        if (def) { 
          setSelectedPaper(def.name); 
          applyPaper(def, d.defaultDpi); 
        }
      }
    } catch { }
    finally { setLoadingInfo(false); }
  };

  const applyPaper = (p: PaperSize, dpiVal: number) => {
    setLabelW(p.widthMm); setLabelH(p.heightMm); setDpi(dpiVal);
    
    // Try loading saved settings for this specific paper size
    const paperKey = `${p.widthMm}x${p.heightMm}`;
    const saved = localStorage.getItem(`barcodeWizardSettings_${paperKey}`);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.columns) setColumns(s.columns);
        if (s.colGap !== undefined) setColGap(s.colGap);
        if (s.lineSpacing !== undefined) setLineSpacing(s.lineSpacing);
        if (s.bcTextSize !== undefined) setBcTextSize(s.bcTextSize);
        if (s.marginT !== undefined) setMarginT(s.marginT);
        if (s.marginL !== undefined) setMarginL(s.marginL);
        if (s.bcH !== undefined) setBcH(s.bcH);
        return;
      } catch (e) {}
    }

    // Default smart configuration for this paper size
    setMarginT(Math.max(Math.round(p.heightMm * 0.03 * 10) / 10, 1.5));
    setMarginL(Math.max(Math.round(p.widthMm * 0.03 * 10) / 10, 1.5));
    
    let defaultBcH = 12;
    if (p.heightMm < 30) {
      defaultBcH = 8;
    } else if (p.heightMm < 60) {
      defaultBcH = 12;
    } else {
      defaultBcH = 25;
    }
    setBcH(defaultBcH);
    setLineSpacing(p.heightMm < 40 ? 1 : 2);
    setColumns(p.widthMm > 70 ? 2 : 1);
  };

  // Build print queue
  const printQueue = variants.flatMap((d, i) => {
    const k = String(d.Id || i);
    if (!selected[k] || !d.Barcode || quantities[k] <= 0) return [];
    return Array(quantities[k]).fill({ barcode: d.Barcode, name: d.SizeName || item?.ItemName || "", price: prices[k] || "0" });
  });

  // Layout height helper computations
  const dots = dpi === 300 ? 11.8 : 8;
  const elementsCount = (showFirm ? 1 : 0) + (showItem ? 1 : 0) + 1 + (showBcText ? 1 : 0);
  const textH = (showFirm ? 28 : 0) + (showItem ? 22 : 0) + (showBcText ? ({ 1: 12, 2: 20, 3: 22, 4: 32, 5: 48 }[bcTextSize] || 22) : 0);
  const totalHdots = (marginT * dots) + textH + (bcH * dots) + (Math.max(0, elementsCount - 1) * (lineSpacing * dots));
  
  // A layout is overflowing the physical label if it exceeds labelH * dots
  const isOverflowing = totalHdots > (labelH * dots);
  
  // Warning threshold: physical unprintable margin of typical thermal printers (3mm = 24 dots at 203dpi)
  const isWarningOverflow = totalHdots > ((labelH * dots) - Math.round(3 * dots));

  const autoFitLayout = () => {
    let currentBcH = bcH;
    let currentLineSpacing = lineSpacing;
    let currentMarginT = marginT;

    const calculateHeight = (bH: number, ls: number, mT: number) => {
      const dotsVal = dpi === 300 ? 11.8 : 8;
      const ec = (showFirm ? 1 : 0) + (showItem ? 1 : 0) + 1 + (showBcText ? 1 : 0);
      const tH = (showFirm ? 28 : 0) + (showItem ? 22 : 0) + (showBcText ? ({ 1: 12, 2: 20, 3: 22, 4: 32, 5: 48 }[bcTextSize] || 22) : 0);
      return (mT * dotsVal) + tH + (bH * dotsVal) + (Math.max(0, ec - 1) * (ls * dotsVal));
    };

    const targetHeight = (labelH * dots) - Math.round(3 * dots); // 3mm bottom safety margin

    for (let step = 0; step < 30; step++) {
      const h = calculateHeight(currentBcH, currentLineSpacing, currentMarginT);
      if (h <= targetHeight) break;

      // 1. First, reduce line spacing if it is > 0.5 mm
      if (currentLineSpacing > 0.5) {
        currentLineSpacing = Math.max(0.5, currentLineSpacing - 0.5);
      }
      // 2. Next, reduce top margin if it is > 1.0 mm
      else if (currentMarginT > 1.0) {
        currentMarginT = Math.max(1.0, currentMarginT - 0.5);
      }
      // 3. Finally, reduce barcode height
      else if (currentBcH > 8) {
        currentBcH = Math.max(8, currentBcH - 1);
      }
      else {
        break;
      }
    }

    setBcH(currentBcH);
    setLineSpacing(currentLineSpacing);
    setMarginT(currentMarginT);
    toast.success(`Layout auto-adjusted! Barcode: ${currentBcH}mm, Line Spacing: ${currentLineSpacing}mm, Top Margin: ${currentMarginT}mm`);
  };

  // Build TSPL — labelW = total paper width, singleLabelW = per-column width
  const buildTspl = () => {
    const dots = dpi === 300 ? 11.8 : 8;
    // labelW IS the total paper/roll width (e.g. 4" roll = 101.6mm)
    // Each individual label occupies: totalWidth / columns
    const singleLabelW = labelW / columns;
    let cmd = "";

    for (let i = 0; i < printQueue.length; i += columns) {
      const row = printQueue.slice(i, i + columns);
      // SIZE = full paper width (unchanged)
      cmd += `SIZE ${labelW} mm, ${labelH} mm\nGAP 2 mm, 0 mm\nDIRECTION 1\nCLS\n`;

      row.forEach((label: any, colIdx: number) => {
        // X start of this column's label area
        const colXmm = colIdx * singleLabelW + marginL;
        const xOff = Math.round(colXmm * dots);
        const xCenterMm = colIdx * singleLabelW + singleLabelW / 2;
        const xCenter = Math.round(xCenterMm * dots);
        let y = Math.round(marginT * dots);
        const yGap = Math.round(lineSpacing * dots);

        if (showFirm) { cmd += `TEXT ${xCenter}, ${y}, "3", 0, 1, 1, 2, "${firmName}"\n`; y += 28 + yGap; }
        if (showItem) { cmd += `TEXT ${xOff}, ${y}, "2", 0, 1, 1, "${label.name}"\n`; y += 22 + yGap; }
        
        const bh = Math.round(bcH * dots);
        const barcodeY = y;
        y += bh + yGap;

        let bcTextY = 0;
        if (showBcText) {
          bcTextY = y;
          y += (22 * bcTextSize) + yGap;
        }

        // Print Text FIRST
        if (showBcText) {
          cmd += `TEXT ${xCenter}, ${bcTextY}, "${bcTextSize}", 0, 1, 1, 2, "${label.barcode}"\n`;
        }

        // Calculate centered X position for standard 1D barcode on the label column
        const singleLabelWdots = singleLabelW * dots;
        const bcStr = label.barcode ? String(label.barcode) : "";
        const barcodeLength = bcStr.length;
        const isAllDigits = /^\d+$/.test(bcStr);
        const code128CharCount = isAllDigits ? Math.ceil(barcodeLength / 2) : barcodeLength;
        const approxBarcodeW = (11 * code128CharCount + 35) * 2; // narrow bar width = 2 dots
        const barcodeX = Math.max(Math.round(colIdx * singleLabelW * dots), Math.round(colIdx * singleLabelW * dots + (singleLabelWdots - approxBarcodeW) / 2));

        // Print Barcode LAST
        cmd += `BARCODE ${barcodeX}, ${barcodeY}, "128", ${bh}, 0, 0, 2, 2, "${label.barcode}"\n`;
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
        `Warning: Your printed content (${Math.round(totalHdots / dots)}mm) is larger than the sticker height (${labelH}mm).\n\nThe barcode number and MRP at the bottom may get cut off on the physical print.\n\nDo you want to print anyway?`
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

  // ── STEP 1 UI ──────────────────────────────────────────────────────────────
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
              <th style={{ width: 100 }}>Price (₹)</th>
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
                    <input type="number" className="form-control form-control-sm" style={{ color: "#212529", backgroundColor: "#fff" }} value={prices[k] || ""} min="0"
                      onChange={e => setPrices(p => ({ ...p, [k]: e.target.value }))} />
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

  // ── STEP 2 UI ──────────────────────────────────────────────────────────────
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

      {/* Columns per row */}
      <div className="border rounded p-3 bg-light mt-2">
        <label className="fw-bold small mb-2 d-block">Label Content &amp; Layout</label>
        <div className="d-flex gap-3 flex-wrap mb-2">
          <label className="form-check-label"><input type="checkbox" className="form-check-input me-1" checked={showFirm} onChange={e => setShowFirm(e.target.checked)} />Firm Name</label>
          <label className="form-check-label"><input type="checkbox" className="form-check-input me-1" checked={showItem} onChange={e => setShowItem(e.target.checked)} />Item Name</label>
          <label className="form-check-label"><input type="checkbox" className="form-check-input me-1" checked={showBcText} onChange={e => setShowBcText(e.target.checked)} />Barcode Number</label>
        </div>
        <div className="d-flex gap-3 align-items-center flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <label className="small fw-bold mb-0">Firm Name:</label>
            <input className="form-control form-control-sm" style={{ maxWidth: 180 }} value={firmName} onChange={e => setFirmName(e.target.value)} />
          </div>
          <div className="d-flex align-items-center gap-2">
            <label className="small fw-bold mb-0">Labels per Row:</label>
            <div className="d-flex gap-1">
              {[1,2,3,4].map(c => (
                <button key={c} className={`btn btn-sm ${columns === c ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setColumns(c)}>{c}</button>
              ))}
            </div>
          </div>
          {columns > 1 && (
            <div className="d-flex align-items-center gap-2">
              <label className="small fw-bold mb-0">Col Gap (mm):</label>
              <input type="number" className="form-control form-control-sm" style={{ width: 65 }} min={0} max={20} value={colGap} onChange={e => setColGap(Number(e.target.value) || 0)} />
            </div>
          )}
        </div>
      </div>

      {/* Auto layout summary */}
      <div className="mt-3 p-3 border rounded bg-white small">
        <strong className="d-block mb-1 text-success"><i className="fa fa-magic me-1" />Auto-Configured Layout</strong>
        <div className="d-flex gap-3 flex-wrap">
          <span>Paper Width (SIZE): <strong>{labelW}mm</strong></span>
          <span>Label Height: <strong>{labelH}mm</strong></span>
          <span>Labels per Row: <strong>{columns}</strong></span>
          <span>Per-Label Width: <strong>{Math.round(labelW / columns * 10) / 10}mm</strong></span>
          <span>DPI: <strong>{dpi}</strong></span>
          <span>Barcode H: <strong>{bcH}mm</strong></span>
        </div>
      </div>
    </div>
  );

  // ── STEP 3 UI (DESIGNER) ───────────────────────────────────────────────────
  const Step3 = () => {
    const PX_PER_MM = 3.2;
    const singleWpx = (labelW / columns) * PX_PER_MM;
    const hPx = labelH * PX_PER_MM;
    const mTPx = marginT * PX_PER_MM;
    const mLPx = marginL * PX_PER_MM;
    const bcHpx = bcH * PX_PER_MM;
    const dummyLabel = { barcode: "890123456789", name: "Sample Item Name", price: "999" };
    
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5 className="fw-bold mb-0">Label Layout Designer</h5>
          <button className="btn btn-sm btn-outline-danger" onClick={() => {
            localStorage.removeItem("barcodeWizardSettings");
            // Clear all per-paper-size settings as well
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("barcodeWizardSettings_")) {
                localStorage.removeItem(key);
                i--;
              }
            }
            hasSavedSettings.current = false;
            setBcH(5); setLineSpacing(1); setMarginT(2); setMarginL(3.1); setBcTextSize(1);
            setLabelW(104.2); setLabelH(152.4); setColumns(2);
            toast.success("Design settings reset to defaults!");
          }}><i className="fa fa-refresh me-1" />Reset to Defaults</button>
        </div>
        <p className="text-muted small mb-3">Fine-tune the design of a single sticker. These settings will apply to all your labels.</p>
        
        {isWarningOverflow && (
          <div className="alert alert-danger p-2 small mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <i className="fa fa-exclamation-triangle me-2" />
              <strong>Warning:</strong> Your content ({Math.round(totalHdots / dots)}mm) is very close to or exceeds the sticker height ({labelH}mm). The barcode number or MRP may get cut off on the physical print!
            </div>
            <button className="btn btn-sm btn-danger fw-bold" onClick={autoFitLayout}>
              <i className="fa fa-magic me-1" /> Auto-Fit Layout
            </button>
          </div>
        )}

        <div className="row">
          <div className="col-md-7">
            <div className="bg-light p-3 border rounded mb-3">
              <label className="fw-bold small d-block mb-3 text-primary"><i className="fa fa-sliders me-1" />Sticker Dimensions & Margins</label>
              
              <label className="small d-flex justify-content-between mb-0"><span>Sticker Width: <strong>{Math.round(labelW / columns * 10) / 10} mm</strong></span></label>
              <input type="range" className="form-range mb-2" min="10" max="150" step="1" value={labelW / columns} onChange={e => setLabelW(Number(e.target.value) * columns)} />
              
              <label className="small d-flex justify-content-between mb-0"><span>Sticker Height: <strong>{labelH} mm</strong></span></label>
              <input type="range" className="form-range mb-2" min="10" max="200" step="1" value={labelH} onChange={e => setLabelH(Number(e.target.value))} />

              <div className="row">
                <div className="col-6">
                  <label className="small d-flex justify-content-between mb-0"><span>Top/Bottom Margin: <strong>{marginT} mm</strong></span></label>
                  <input type="range" className="form-range" min="0" max="20" step="0.5" value={marginT} onChange={e => setMarginT(Number(e.target.value))} />
                </div>
                <div className="col-6">
                  <label className="small d-flex justify-content-between mb-0"><span>Left/Right Margin: <strong>{marginL} mm</strong></span></label>
                  <input type="range" className="form-range" min="0" max="20" step="0.5" value={marginL} onChange={e => setMarginL(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="bg-light p-3 border rounded">
              <label className="fw-bold small d-block mb-3 text-primary"><i className="fa fa-text-height me-1" />Content Spacing & Sizes</label>
              
              <label className="small d-flex justify-content-between mb-0"><span>Line Spacing (Gap): <strong>{lineSpacing} mm</strong></span></label>
              <input type="range" className="form-range mb-2" min="0" max="15" step="0.5" value={lineSpacing} onChange={e => setLineSpacing(Number(e.target.value))} />
              
              <label className="small d-flex justify-content-between mb-0"><span>Barcode Height: <strong>{bcH} mm</strong></span></label>
              <input type="range" className="form-range mb-2" min="5" max="100" step="1" value={bcH} onChange={e => setBcH(Number(e.target.value))} />

              <label className="small d-flex justify-content-between mb-0"><span>Barcode Text Size: <strong>{bcTextSize}</strong></span></label>
              <input type="range" className="form-range" min="1" max="5" step="1" value={bcTextSize} onChange={e => setBcTextSize(Number(e.target.value))} />
            </div>
          </div>
          
          <div className="col-md-5 d-flex flex-column align-items-center justify-content-center bg-white border rounded shadow-sm p-4" style={{ minHeight: 400, overflow: "auto" }}>
            <span className="badge bg-secondary mb-3">Live Preview</span>
            <div style={{ width: singleWpx, height: hPx, border: "2px dashed #0d6efd", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", background: "#fff", overflow: "hidden", padding: `${mTPx}px ${mLPx}px`, gap: lineSpacing * PX_PER_MM, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              {showFirm && <div style={{ fontWeight: 700, fontSize: Math.max(singleWpx * 0.07, 8), textAlign: "center", lineHeight: 1, width: "100%" }}>{firmName}</div>}
              {showItem && <div style={{ fontSize: Math.max(singleWpx * 0.06, 7), textAlign: "left", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", width: "100%", lineHeight: 1 }}>{dummyLabel.name}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: bcHpx }}>
                <Barcode value={dummyLabel.barcode} height={Math.max(bcHpx, 10)} width={Math.max((singleWpx - mLPx * 2) / 70, 0.8)} displayValue={false} margin={0} background="transparent" />
              </div>
              {showBcText && <div style={{ fontWeight: 700, fontSize: Math.max(singleWpx * 0.03 * bcTextSize, 8), textAlign: "center", lineHeight: 1, width: "100%", letterSpacing: 2 }}>{dummyLabel.barcode}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── STEP 4 UI (PREVIEW & PRINT) ────────────────────────────────────────────
  const Step4 = () => {
    const PX_PER_MM = 3.2;
    const totalWpx = labelW * PX_PER_MM;
    const singleWpx = totalWpx / columns;
    const hPx = labelH * PX_PER_MM;
    const mTPx = marginT * PX_PER_MM;
    const mLPx = marginL * PX_PER_MM;
    const bcHpx = bcH * PX_PER_MM;

    return (
      <div>
        <h5 className="fw-bold mb-1">Print Preview &amp; Actions</h5>
        <p className="text-muted small mb-3">Verify the print job preview and click <strong>Print Now</strong>.</p>

        {isWarningOverflow && (
          <div className="alert alert-danger p-2 small mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <i className="fa fa-exclamation-triangle me-2" />
              <strong>Layout Warning:</strong> Your content ({Math.round(totalHdots / dots)}mm) is very close to or exceeds the sticker height ({labelH}mm). The barcode number or MRP may get cut off on the physical print!
            </div>
            <button className="btn btn-sm btn-danger fw-bold" onClick={autoFitLayout}>
              <i className="fa fa-magic me-1" /> Auto-Fit Layout
            </button>
          </div>
        )}

        <div className="d-flex align-items-center gap-3 mb-3 p-3 bg-light border rounded flex-wrap">
          <div><strong>Printer:</strong> {printerName || <span className="text-danger">Not selected</span>}</div>
          <div><strong>Paper:</strong> {selectedPaper || `${labelW}×${labelH}mm`}</div>
          <div><strong>Labels:</strong> {printQueue.length}</div>
          <div><strong>DPI:</strong> {dpi}</div>
          <button className="btn btn-success ms-auto px-4 py-2 fw-bold" onClick={handlePrint} disabled={printing || printQueue.length === 0 || !printerName}>
            {printing ? <><i className="fa fa-spinner fa-spin me-2" />Printing...</> : <><i className="fa fa-print me-2" />Print Now</>}
          </button>
        </div>

        {/* Label previews - each row = one physical print strip */}
        <div className="mb-2"><small className="text-muted"><i className="fa fa-info-circle me-1" />Each dashed box = 1 print strip ({columns} label{columns > 1 ? "s" : ""} side-by-side). Paper width: <strong>{labelW}mm</strong>, per-label: <strong>{Math.round(labelW / columns * 10) / 10}mm</strong></small></div>
        <div ref={previewRef} style={{ display: "flex", flexDirection: "column", gap: 10, padding: 8 }}>
          {Array.from({ length: Math.ceil(Math.min(printQueue.length, 20) / columns) }).map((_, rowIdx) => {
            const rowLabels = (printQueue as any[]).slice(rowIdx * columns, rowIdx * columns + columns);
            return (
              <div key={rowIdx} style={{ display: "inline-flex", gap: 0, alignItems: "flex-start", border: "2px dashed #0d6efd", borderRadius: 6, padding: 4, background: "#f0f4ff", width: "fit-content" }}>
                {rowLabels.map((label: any, colIdx: number) => (
                  <div key={colIdx} style={{ width: singleWpx, height: hPx, borderLeft: colIdx > 0 ? "1px dashed #aaa" : "none", border: "1.5px solid #333", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", background: "#fff", overflow: "hidden", padding: `${mTPx}px ${mLPx}px`, gap: lineSpacing * PX_PER_MM, flexShrink: 0 }}>
                    {showFirm && <div style={{ fontWeight: 700, fontSize: Math.max(singleWpx * 0.07, 8), textAlign: "center", lineHeight: 1, width: "100%" }}>{firmName}</div>}
                    {showItem && <div style={{ fontSize: Math.max(singleWpx * 0.06, 7), textAlign: "left", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", width: "100%", lineHeight: 1 }}>{label.name}</div>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: bcHpx }}>
                      <Barcode value={label.barcode} height={Math.max(bcHpx, 10)} width={Math.max((singleWpx - mLPx * 2) / 70, 0.8)} displayValue={false} margin={0} background="transparent" />
                    </div>
                    {showBcText && <div style={{ fontWeight: 700, fontSize: Math.max(singleWpx * 0.03 * bcTextSize, 8), textAlign: "center", lineHeight: 1, width: "100%", letterSpacing: 2 }}>{label.barcode}</div>}
                  </div>
                ))}
              </div>
            );
          })}
          {printQueue.length > 20 && <div style={{ color: "#6c757d", fontWeight: 600, padding: 8 }}>+{printQueue.length - 20} more labels ({Math.ceil((printQueue.length - 20) / columns)} more rows)</div>}
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
                    <Step1 />
                  </div>
                  <div className="col-lg-5 border-start ps-lg-4">
                    <Step4 />
                  </div>
                </div>
              )}
              {activeTab === "hardware" && (
                <div>
                  <Step2 />
                  <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                    <button className="btn btn-primary px-4 fw-bold" onClick={() => setActiveTab("print")}>
                      Go to Print Dashboard <i className="fa fa-arrow-right ms-2" />
                    </button>
                  </div>
                </div>
              )}
              {activeTab === "designer" && (
                <div>
                  <Step3 />
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
