/**
 * Returns the current logged-in user ID from localStorage authUser (set at login).
 * Use when appending UserId to FormData in masters/transactions.
 * Returns "0" if not logged in or authUser missing.
 */
export function getCurrentUserId(): string {
  try {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const id = authUser?.Id ?? authUser?.uid ?? authUser?.id;
    return id !== undefined && id !== null ? String(id) : "0";
  } catch {
    return "0";
  }
}

/**
 * Returns the logged-in user's company ID (F_CompanyMaster) from localStorage authUser.
 * Use alongside UserId when appending to FormData. Returns "0" if not set.
 */
export function getLoggedInCompanyId(): string {
  try {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const id = authUser?.F_CompanyMaster ?? authUser?.CompanyId ?? authUser?.F_Company;
    return id !== undefined && id !== null ? String(id) : "0";
  } catch {
    return "0";
  }
}

/**
 * Validates that a string value is non-negative (allows empty, digits, optional decimal).
 * Use in onChange for number inputs to prevent negative values.
 */
export function allowNonNegative(value: string): boolean {
  return value === "" || /^\d*\.?\d*$/.test(value);
}

/**
 * Handles Enter, Tab, and Shift+Tab in master forms: move focus to next/previous field.
 * Enter/Tab = next field; Shift+Tab = previous field.
 * Attach to Form: onKeyDown={handleEnterToNextField}
 * Skip for textarea on Enter so Enter can insert newline.
 */
export function handleEnterToNextField(e: React.KeyboardEvent<HTMLFormElement>): void {
  const isEnter = e.key === "Enter";
  const isTab = e.key === "Tab";
  if (!isEnter && !isTab) return;

  const target = e.target as HTMLElement;
  if (isEnter && target.tagName === "TEXTAREA") return;

  const form = (e.currentTarget || target.closest("form")) as HTMLFormElement | null;
  if (!form) return;

  const focusableSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';
  const inputs = Array.from(form.querySelectorAll<HTMLElement>(focusableSelector));
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const focusables = submitBtn ? [...inputs, submitBtn] : inputs;

  if (focusables.length === 0) return;

  const current = document.activeElement as HTMLElement;
  const idx = focusables.indexOf(current);

  if (isTab && e.shiftKey) {
    if (idx > 0) {
      e.preventDefault();
      focusables[idx - 1].focus();
    } else if (idx === -1) {
      e.preventDefault();
      focusables[focusables.length - 1].focus();
    }
    return;
  }

  if (isTab || isEnter) {
    e.preventDefault();
    if (idx >= 0 && idx < focusables.length - 1) {
      focusables[idx + 1].focus();
    } else if (idx === focusables.length - 1 && submitBtn && !submitBtn.disabled) {
      submitBtn.focus();
    } else if (idx < 0 && inputs.length > 0) {
      focusables[0].focus();
    }
  }
}
