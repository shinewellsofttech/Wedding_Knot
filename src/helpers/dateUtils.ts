/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDateYYYYMMDD = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Get current date in DD/MM/YYYY format
 */
export const getCurrentDateDDMMYYYY = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
};

/**
 * Format date to DD/MM/YYYY format
 * @param dateValue - Date to format (can be ISO string, date string, or Date object)
 * @returns Formatted date in DD/MM/YYYY format or '-' if invalid
 */
export const formatDateDDMMYYYY = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return "-";
  
  // If string, handle known formats directly to avoid timezone offsets
  if (typeof dateValue === "string") {
    const str = dateValue.trim();
    if (!str || str === "null" || str === "undefined" || str.startsWith("0001-01-01")) return "-";

    // If already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      return str;
    }

    // If YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, "0");
      const day = ymdMatch[3].padStart(2, "0");
      return `${day}/${month}/${year}`;
    }
  }
  
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year < 1900) return "-";
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error("Error formatting date:", error);
  }
  
  return "-";
};

/**
 * Safely parse date from API response to YYYY-MM-DD format
 * Handles timezone issues by extracting date part directly
 * @param dateValue - Date value from API (can be ISO string, date string, or Date object)
 * @returns Formatted date in YYYY-MM-DD format or empty string if invalid
 */
export const parseDateFromAPI = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return "";
  
  if (typeof dateValue === "string") {
    const str = dateValue.trim();
    if (!str || str === "null" || str === "undefined" || str.startsWith("0001-01-01")) return "";

    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    
    // If it's an ISO string with time or other separators, extract just the date part
    const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, "0");
      const day = ymdMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // If DD/MM/YYYY format
    const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const month = dmyMatch[2].padStart(2, "0");
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
  }
  
  // Try to parse as Date object
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year < 1900) return "";
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error("Error parsing date:", error);
  }
  
  return "";
};
