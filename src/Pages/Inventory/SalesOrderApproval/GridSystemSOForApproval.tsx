import React, { useRef } from "react";
import { Col, Row } from "reactstrap";
import { formatDateDDMMYYYY } from "../../../helpers/dateUtils";

const tableStyles = `
  .so-approval-grid-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }
  .so-approval-grid-wrap .so-table {
    min-width: 900px;
    margin-bottom: 0;
  }
  .so-table th:nth-child(1), .so-table td:nth-child(1) { width: 5%; min-width: 40px; text-align: center; }
  .so-table th:nth-child(2), .so-table td:nth-child(2) { width: 8%; min-width: 70px; }
  .so-table th:nth-child(3), .so-table td:nth-child(3) { width: 8%; min-width: 70px; }
  .so-table th:nth-child(4), .so-table td:nth-child(4) { width: 12%; min-width: 100px; }
  .so-table th:nth-child(5), .so-table td:nth-child(5) { width: 10%; min-width: 85px; }
  .so-table th:nth-child(6), .so-table td:nth-child(6) { width: 10%; min-width: 85px; }
  .so-table th:nth-child(7), .so-table td:nth-child(7) { width: 15%; min-width: 120px; }
  .so-table th:nth-child(8), .so-table td:nth-child(8) { width: 10%; min-width: 85px; }
  .so-table th:nth-child(9), .so-table td:nth-child(9) { width: 9%; min-width: 75px; text-align: right; }
  .so-table th:nth-child(10), .so-table td:nth-child(10) { width: 8%; min-width: 70px; }
  .so-table th:nth-child(11), .so-table td:nth-child(11) { width: 10%; min-width: 80px; text-align: center; }
  
  @media (max-width: 991.98px) {
    .so-approval-grid-wrap .so-table { min-width: 850px; }
    .so-table th, .so-table td { padding: 0.28rem 0.2rem; font-size: 0.8rem; }
    .so-table .form-control { font-size: 0.8rem; padding: 0.22rem 0.3rem; min-height: 26px; height: auto; }
    .so-table .btn-sm { padding: 0.2rem 0.35rem; min-width: 28px; font-size: 0.75rem; }
  }
  @media (max-width: 767.98px) {
    .so-approval-grid-wrap .so-table { min-width: 800px; }
    .so-table th, .so-table td { padding: 0.2rem 0.15rem; font-size: 0.7rem; }
    .so-table .form-control { font-size: 0.7rem; padding: 0.15rem 0.25rem; min-height: 22px; height: auto; }
    .so-table .btn-sm { padding: 0.15rem 0.28rem; min-width: 26px; font-size: 0.7rem; }
  }
`;

interface GridRow {
  F_SalesMasterL: string | number;
  SONo: string;
  SDate: string;
  VendorName: string;
  GroupName: string;
  ItemCode: string;
  ItemName: string;
  ColorName: string;
  Qty: string;
  OriginalQty: string;
  Status: string;
  ItemData: any;
}

interface GridSystemSOForApprovalProps {
  gridRows: GridRow[];
  onApproveRow: (row: GridRow, index: number) => void;
  onRejectRow: (row: GridRow, index: number) => void;
  onUpdateRow: (index: number, field: string, value: any) => void;
  statusSelected: string;
}

const GridSystemSOForApproval: React.FC<GridSystemSOForApprovalProps> = ({ 
  gridRows, 
  onApproveRow, 
  onRejectRow, 
  onUpdateRow,
  statusSelected,
}) => {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLButtonElement | null }>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const handleKeyDown = (event: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      if (fieldName === 'Qty') {
        const approveRef = buttonRefs.current[`${rowIndex}-approve`];
        if (approveRef) {
          approveRef.focus();
        }
      } else {
        let nextFieldName = '';
        if (fieldName === 'F_ItemGroupMaster') nextFieldName = 'F_ItemMaster';
        else if (fieldName === 'F_ItemMaster') nextFieldName = 'F_ColorMaster';
        else if (fieldName === 'F_ColorMaster') nextFieldName = 'Qty';
        
        const nextRef = inputRefs.current[`${rowIndex}-${nextFieldName}`];
        if (nextRef) nextRef.focus();
      }
    }
  };

  const handleButtonKeyDown = (event: React.KeyboardEvent, rowIndex: number, buttonType: string) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      if (buttonType === 'approve') {
        const rejectRef = buttonRefs.current[`${rowIndex}-reject`];
        if (rejectRef) rejectRef.focus();
      } else if (buttonType === 'reject') {
        const nextRowIndex = rowIndex + 1;
        if (nextRowIndex < gridRows.length) {
          const nextQtyRef = inputRefs.current[`${nextRowIndex}-Qty`];
          if (nextQtyRef) nextQtyRef.focus();
        } else {
          const firstQtyRef = inputRefs.current[`0-Qty`];
          if (firstQtyRef) firstQtyRef.focus();
        }
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (buttonType === 'approve') onApproveRow(gridRows[rowIndex], rowIndex);
      else if (buttonType === 'reject') onRejectRow(gridRows[rowIndex], rowIndex);
    }
  };

  const setInputRef = (ref: HTMLInputElement | null, rowIndex: number, fieldName: string) => {
    inputRefs.current[`${rowIndex}-${fieldName}`] = ref;
  };

  const setButtonRef = (ref: HTMLButtonElement | null, rowIndex: number, buttonType: string) => {
    buttonRefs.current[`${rowIndex}-${buttonType}`] = ref;
  };

  return (
    <>
      <style>{tableStyles}</style>
      <Row className="mb-3">
        <Col xs="12">
          <div className="table-responsive so-approval-grid-wrap">
            <table className="table table-bordered table-striped so-table">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>SO No.</th>
                  <th>SDate</th>
                  <th>Party Name</th>
                  <th>Item Code</th>
                  <th>Item Group</th>
                  <th>Item Name</th>
                  <th>Color</th>
                  <th>Qty</th>
                  <th>Status</th>
                  {["Draft", "2", 2, "Both", "3", 3].includes(statusSelected) ? (
                    <th>Action</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {gridRows.length === 0 ? (
                  <tr>
                    <td colSpan={["Draft", "2", 2, "Both", "3", 3].includes(statusSelected) ? 11 : 10} className="text-center text-muted py-4">
                      No sales orders found.
                    </td>
                  </tr>
                ) : (
                  gridRows.map((row, index) => (
                    <tr key={index}>
                      <td className="py-0">{index + 1}</td>
                      <td className="py-0">{row.SONo}</td>
                      <td className="py-0">{formatDateDDMMYYYY(row.SDate)}</td>
                      <td className="py-0">{row.VendorName}</td>
                      <td className="py-0">{row.ItemCode}</td>
                      <td className="py-0">{row.GroupName}</td>
                      <td className="py-0">{row.ItemName}</td>
                      <td className="py-0">{row.ColorName}</td>
                      <td className="py-0" style={{ textAlign: "right" }}>
                        <input
                          ref={(ref) => setInputRef(ref, index, "Qty")}
                          type="number"
                          className="form-control"
                          style={{ textAlign: "right", width: "100%", minWidth: "75px" }}
                          value={row.Qty}
                          onChange={(e) => onUpdateRow(index, "Qty", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, "Qty")}
                          placeholder="Qty"
                          min={1}
                          disabled={["Approved", "1", 1].includes(row.Status) || (["Both", "3", 3].includes(statusSelected) && row.Status !== "New")}
                        />
                      </td>
                      <td className="py-0">{row.Status}</td>
                      {(() => {
                        const showButtons = ["Draft", "2", 2].includes(statusSelected) || 
                                           (["Both", "3", 3].includes(statusSelected) && (row.Status === "New" || row.Status === "Draft"));
                        
                        return showButtons ? (
                          <td className="py-0">
                            <div className="d-flex gap-1 justify-content-center">
                              <button
                                ref={(ref) => setButtonRef(ref, index, "approve")}
                                type="button"
                                className="btn btn-success btn-sm d-flex align-items-center gap-1"
                                onClick={() => onApproveRow(row, index)}
                                onKeyDown={(e) => handleButtonKeyDown(e, index, "approve")}
                                title="Approve Row"
                              >
                                <i className="bx bx-check-circle"></i> Approve
                              </button>
                        
                              <button
                                ref={(ref) => setButtonRef(ref, index, "reject")}
                                type="button"
                                className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                                onClick={() => onRejectRow(row, index)}
                                onKeyDown={(e) => handleButtonKeyDown(e, index, "reject")}
                                title="Reject Row"
                              >
                                <i className="bx bx-x-circle"></i> Reject
                              </button>
                            </div>
                          </td>
                        ) : null;
                      })()}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default GridSystemSOForApproval;
