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
 * Format date to DD/MM/YYYY format
 * @param dateValue - Date to format (can be ISO string, date string, or Date object)
 * @returns Formatted date in DD/MM/YYYY format or '-' if invalid
 */
export const formatDateDDMMYYYY = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return '-';
  
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  return '-';
};

/**
 * Safely parse date from API response to YYYY-MM-DD format
 * Handles timezone issues by extracting date part directly
 * @param dateValue - Date value from API (can be ISO string, date string, or Date object)
 * @returns Formatted date in YYYY-MM-DD format or empty string if invalid
 */
export const parseDateFromAPI = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return '';
  
  // If it's already in YYYY-MM-DD format, return as is
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // If it's an ISO string with time, extract just the date part before any timezone conversion
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    const datePart = dateValue.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }
  
  // Try to parse as Date object
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }
  
  return '';
};

