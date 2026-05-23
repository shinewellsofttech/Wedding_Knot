import React, { useEffect, useRef } from "react";
import { Col, Row } from "reactstrap";
import { allowNonNegative } from "../../../utils/formUtils";

interface GridRow {
  Type: string;
  F_AccountMaster: string;
  NameOfAccounts: string;
  DebitAmt: string;
  CreditAmt: string;
  Balance: string;
}

interface AccountMaster {
  Id: number | string;
  Name: string;
  Balance?: number;
  CurrentBalance?: number;
  BalanceAmount?: number;
}

interface GridSystemVoucherEntryProps {
  gridRows: GridRow[];
  accountMaster: AccountMaster[];
  accountMasterBankAndCash?: AccountMaster[];
  voucherTypeId?: string;
  onAddRow: (rowIndex: number) => void;
  focusNewRowIndex?: number | null;
  onFocusNewRowComplete?: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, field: string, value: string) => void;
  onRemoveButtonTabFocus?: React.RefObject<HTMLElement | null>;
  onShiftTabToForm?: () => void;
  disabled?: boolean;
}

// Column width adjustments + responsive (compact on tablet & mobile)
const tableStyles = `
  .voucher-grid-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }
  .voucher-grid-wrap .po-table {
    min-width: 640px;
    margin-bottom: 0;
  }
  .po-table th:nth-child(1), .po-table td:nth-child(1) { width: 8%; min-width: 44px; }
  .po-table th:nth-child(2), .po-table td:nth-child(2) { width: 10%; min-width: 56px; }
  .po-table th:nth-child(3), .po-table td:nth-child(3) { width: 35%; min-width: 140px; }
  .po-table th:nth-child(4), .po-table td:nth-child(4) { width: 15%; min-width: 90px; }
  .po-table th:nth-child(5), .po-table td:nth-child(5) { width: 15%; min-width: 90px; }
  .po-table th:nth-child(6), .po-table td:nth-child(6) { width: 15%; min-width: 90px; }
  .po-table th:nth-child(7), .po-table td:nth-child(7) { width: 10%; min-width: 72px; }
  /* Debit Amt / Credit Amt - no color change when disabled */
  .po-table td:nth-child(4) input:disabled,
  .po-table td:nth-child(5) input:disabled {
    background-color: #fff;
    color: #212529;
    opacity: 1;
  }
  @media (max-width: 991.98px) {
    .voucher-grid-wrap .po-table { min-width: 580px; }
    .po-table th, .po-table td { padding: 0.28rem 0.2rem; font-size: 0.8rem; }
    .po-table .form-control { font-size: 0.8rem; padding: 0.22rem 0.3rem; min-height: 26px; height: auto; }
    .po-table .btn-sm { padding: 0.2rem 0.35rem; min-width: 28px; font-size: 0.75rem; }
    .po-table th:nth-child(1), .po-table td:nth-child(1) { min-width: 38px; }
    .po-table th:nth-child(4), .po-table td:nth-child(4),
    .po-table th:nth-child(5), .po-table td:nth-child(5),
    .po-table th:nth-child(6), .po-table td:nth-child(6) { min-width: 78px; }
  }
  @media (max-width: 767.98px) {
    .voucher-grid-wrap .po-table { min-width: 520px; }
    .po-table th, .po-table td { padding: 0.2rem 0.15rem; font-size: 0.7rem; }
    .po-table .form-control { font-size: 0.7rem; padding: 0.15rem 0.25rem; min-height: 22px; height: auto; }
    .po-table .btn-sm { padding: 0.15rem 0.28rem; min-width: 26px; font-size: 0.7rem; }
    .po-table th:nth-child(1), .po-table td:nth-child(1) { min-width: 32px; }
    .po-table th:nth-child(7), .po-table td:nth-child(7) { min-width: 58px; }
    .po-table th:nth-child(4), .po-table td:nth-child(4),
    .po-table th:nth-child(5), .po-table td:nth-child(5),
    .po-table th:nth-child(6), .po-table td:nth-child(6) { min-width: 68px; }
  }
`;

const GridSystemVoucherEntry: React.FC<GridSystemVoucherEntryProps> = ({
  gridRows,
  accountMaster,
  accountMasterBankAndCash,
  voucherTypeId,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onRemoveButtonTabFocus,
  onShiftTabToForm,
  focusNewRowIndex = null,
  onFocusNewRowComplete,
  disabled = false,
}) => {
  // VT 2 (Receipt): Dr rows = Bank & Cash, Cr rows = all. VT 3 (Payment): Cr rows = Bank & Cash, Dr rows = all
  const getLedgerListForRow = (row: GridRow) => {
    if (!accountMasterBankAndCash?.length || !voucherTypeId) return accountMaster || [];
    if (voucherTypeId === "2") return row.Type === "Dr" ? accountMasterBankAndCash : (accountMaster || []);
    if (voucherTypeId === "3") return row.Type === "Cr" ? accountMasterBankAndCash : (accountMaster || []);
    return accountMaster || [];
  };
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Focus new row when parent signals (after add) - use F_AccountMaster since Type is disabled for non-first rows
  useEffect(() => {
    if (focusNewRowIndex == null || !onFocusNewRowComplete) return;
    const focusEl = () => {
      // Type is disabled for index!==0, so focus Name Of Accounts (first editable field) instead
      const el = document.querySelector(`select[data-row="${focusNewRowIndex}"][data-field="F_AccountMaster"]`) as HTMLSelectElement
        || document.querySelector(`select[data-row="${focusNewRowIndex}"][data-field="Type"]`) as HTMLSelectElement;
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        el.focus();
      }
      onFocusNewRowComplete();
    };
    requestAnimationFrame(() => requestAnimationFrame(focusEl));
  }, [focusNewRowIndex, onFocusNewRowComplete]);

  const handleKeyDown = (event: React.KeyboardEvent, rowIndex: number, fieldName: string) => {
    if (disabled) {
      return;
    }
    const isShiftTab = event.key === "Tab" && event.shiftKey;
    const isTabOrEnter = event.key === "Enter" || (event.key === "Tab" && !event.shiftKey);

    if (isShiftTab) {
      event.preventDefault();
      const row = gridRows[rowIndex] || {};
      if (fieldName === "Type") {
        if (rowIndex === 0 && onShiftTabToForm) {
          onShiftTabToForm();
        } else {
          const prevRowRemoveRef = buttonRefs.current[`${rowIndex - 1}-RemoveButton`];
          if (prevRowRemoveRef) prevRowRemoveRef.focus();
        }
      } else if (fieldName === "F_AccountMaster") {
        const prevRef = inputRefs.current[`${rowIndex}-Type`];
        if (prevRef) prevRef.focus();
      } else if (fieldName === "DebitAmt") {
        const prevRef = inputRefs.current[`${rowIndex}-F_AccountMaster`];
        if (prevRef) prevRef.focus();
      } else if (fieldName === "CreditAmt") {
        if (row.Type === "Dr") {
          const prevRef = inputRefs.current[`${rowIndex}-DebitAmt`];
          if (prevRef) prevRef.focus();
        } else {
          const prevRef = inputRefs.current[`${rowIndex}-F_AccountMaster`];
          if (prevRef) prevRef.focus();
        }
      }
      return;
    }

    if (isTabOrEnter) {
      event.preventDefault();

      // Skip Balance field - never navigate to it
      if (fieldName === "Balance") {
        const addButtonRef = buttonRefs.current[`${rowIndex}-AddButton`];
        if (addButtonRef) addButtonRef.focus();
        return;
      }

      let nextFieldName = "";
      const row = gridRows[rowIndex] || {};

      if (fieldName === "Type") {
        nextFieldName = "F_AccountMaster";
      } else if (fieldName === "F_AccountMaster") {
        nextFieldName = row.Type === "Cr" ? "CreditAmt" : "DebitAmt";
      } else if (fieldName === "DebitAmt") {
        if (row.Type === "Dr") {
          const addButtonRef = buttonRefs.current[`${rowIndex}-AddButton`];
          if (addButtonRef) addButtonRef.focus();
          return;
        } else {
          nextFieldName = "CreditAmt";
        }
      } else if (fieldName === "CreditAmt") {
        const addButtonRef = buttonRefs.current[`${rowIndex}-AddButton`];
        if (addButtonRef) addButtonRef.focus();
        return;
      }

      if (nextFieldName) {
        const nextRef = inputRefs.current[`${rowIndex}-${nextFieldName}`];
        if (nextRef) nextRef.focus();
      }
    }
  };

  const handleButtonKeyDown = (event: React.KeyboardEvent, rowIndex: number, buttonType: string) => {
    // Prevent Space from triggering Add button (only Enter adds row)
    if (buttonType === "AddButton" && event.key === " ") {
      event.preventDefault();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const row = gridRows[rowIndex] || {};

      if (event.shiftKey) {
        if (buttonType === "RemoveButton") {
          const addButtonRef = buttonRefs.current[`${rowIndex}-AddButton`];
          if (addButtonRef) addButtonRef.focus();
        } else if (buttonType === "AddButton") {
          const lastInputRef = row.Type === "Cr"
            ? inputRefs.current[`${rowIndex}-CreditAmt`]
            : inputRefs.current[`${rowIndex}-DebitAmt`];
          if (lastInputRef) lastInputRef.focus();
        }
      } else {
        if (buttonType === "AddButton") {
          const removeButtonRef = buttonRefs.current[`${rowIndex}-RemoveButton`];
          if (removeButtonRef) removeButtonRef.focus();
        } else if (buttonType === "RemoveButton") {
          if (onRemoveButtonTabFocus?.current) {
            (onRemoveButtonTabFocus.current as HTMLButtonElement).focus();
          } else {
            const firstTypeRef = inputRefs.current[`0-Type`];
            if (firstTypeRef) firstTypeRef.focus();
          }
        }
      }
    } else if (event.key === "Enter") {
      event.preventDefault();

      if (buttonType === "AddButton") {
        // Enter on + button triggers add only if row has amount
        const row = gridRows[rowIndex] || {};
        const hasAmount = parseFloat(String(row.DebitAmt || "0")) > 0 || parseFloat(String(row.CreditAmt || "0")) > 0;
        if (hasAmount) {
          onAddRow(rowIndex);
        }
      } else if (buttonType === "RemoveButton") {
        // Enter on - button triggers the click
        onRemoveRow(rowIndex);

        // Focus on the same row's Type field (or previous row if this was the last row)
        setTimeout(() => {
          const targetRowIndex = rowIndex < gridRows.length - 1 ? rowIndex : Math.max(0, rowIndex - 1);
          const targetTypeRef = inputRefs.current[`${targetRowIndex}-Type`];
          if (targetTypeRef) {
            targetTypeRef.focus();
          }
        }, 100);
      }
    }
  };
  

  const setInputRef = (ref: HTMLInputElement | HTMLSelectElement | null, rowIndex: number, fieldName: string) => {
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
          <div className="table-responsive voucher-grid-wrap">
            <table className="table table-bordered table-striped po-table">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>Type</th>
                  <th>Name Of Accounts</th>
                  <th style={{ textAlign: "right" }}>Debit Amt</th>
                  <th style={{ textAlign: "right" }}>Credit Amt</th>
                  <th style={{ textAlign: "right", display: "none" }}>Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row, index) => {
                  const hasAmount = parseFloat(String(row.DebitAmt || "0")) > 0 || parseFloat(String(row.CreditAmt || "0")) > 0;
                  return (
                  <tr key={index}>
                    <td className="py-0">{index + 1}</td>

                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, "Type")}
                        className="form-control"
                        value={row.Type}
                        onChange={(e) => onUpdateRow(index, "Type", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "Type")}
                        data-row={index}
                        data-field="Type"
                        disabled={disabled || index !== 0}
                      >
                        <option value="Cr">Cr</option>
                        <option value="Dr">Dr</option>
                      </select>
                    </td>

                    <td className="py-0">
                      <select
                        ref={(ref) => setInputRef(ref, index, "F_AccountMaster")}
                        className="form-control"
                        value={row.F_AccountMaster}
                        onChange={(e) => onUpdateRow(index, "F_AccountMaster", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "F_AccountMaster")}
                        data-row={index}
                        data-field="F_AccountMaster"
                        disabled={disabled}
                      >
                        <option value="">Select Account</option>
                        {getLedgerListForRow(row)?.map((account) => {
                            // Check if this account is already selected in another row
                            const isAlreadySelected = gridRows.some(
                              (r, i) => i !== index && r.F_AccountMaster && String(r.F_AccountMaster) === String(account.Id)
                            );
                            return (
                              <option
                                key={account.Id}
                                value={account.Id}
                                disabled={isAlreadySelected}
                              >
                                {account.Name}
                              </option>
                            );
                          })}
                      </select>
                    </td>

                    <td className="py-0" style={{ textAlign: "right" }}>
                      <input
                        ref={(ref) => setInputRef(ref, index, "DebitAmt")}
                        type="number"
                        step="1"
                        min="0"
                        className="form-control"
                        style={{
                          textAlign: "right",
                          width: "100%",
                          minWidth: "80px",
                        }}
                        value={row.DebitAmt}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!allowNonNegative(value)) return;
                          onUpdateRow(index, "DebitAmt", value);
                          // Clear CreditAmt if DebitAmt is entered
                          if (value && parseFloat(value) > 0) {
                            onUpdateRow(index, "CreditAmt", "");
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, "DebitAmt")}
                        data-row={index}
                        data-field="DebitAmt"
                        disabled={disabled || row.Type === "Cr"}
                        placeholder="0.00"
                      />
                    </td>

                    <td className="py-0" style={{ textAlign: "right" }}>
                      <input
                        ref={(ref) => setInputRef(ref, index, "CreditAmt")}
                        type="number"
                        step="1"
                        min="0"
                        className="form-control"
                        style={{
                          textAlign: "right",
                          width: "100%",
                          minWidth: "80px",
                        }}
                        value={row.CreditAmt}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!allowNonNegative(value)) return;
                          onUpdateRow(index, "CreditAmt", value);
                          // Clear DebitAmt if CreditAmt is entered
                          if (value && parseFloat(value) > 0) {
                            onUpdateRow(index, "DebitAmt", "");
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index, "CreditAmt")}
                        data-row={index}
                        data-field="CreditAmt"
                        disabled={disabled || row.Type === "Dr"}
                        placeholder="0.00"
                      />
                    </td>

                    <td className="py-0" style={{ textAlign: "right", display: "none" }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{
                          textAlign: "right",
                          width: "100%",
                          minWidth: "80px",
                        }}
                        value={
                          row.Balance !== undefined && row.Balance !== null && row.Balance !== ""
                            ? parseFloat(row.Balance).toFixed(2)
                            : "0.00"
                        }
                        readOnly
                        tabIndex={-1}
                        data-row={index}
                        data-field="Balance"
                        title={
                          row.F_AccountMaster
                            ? `Account Current Balance: ${
                                row.Balance !== undefined && row.Balance !== null && row.Balance !== ""
                                  ? parseFloat(row.Balance).toFixed(2)
                                  : "0.00"
                              }`
                            : "Balance"
                        }
                      />
                    </td>

                    <td className="py-0">
                      <div className="d-flex gap-1">
                        <button
                          ref={(ref) => setButtonRef(ref, index, "AddButton")}
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => onAddRow(index)}
                          onKeyDown={(e) => handleButtonKeyDown(e, index, "AddButton")}
                          disabled={disabled || !hasAmount}
                          title="Add Row"
                        >
                          <i className="fa fa-plus"></i>
                        </button>
                        <button
                          ref={(ref) => setButtonRef(ref, index, "RemoveButton")}
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onRemoveRow(index)}
                          onKeyDown={(e) => handleButtonKeyDown(e, index, "RemoveButton")}
                          disabled={disabled}
                          title="Remove Row"
                        >
                          <i className="fa fa-minus"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default GridSystemVoucherEntry;
