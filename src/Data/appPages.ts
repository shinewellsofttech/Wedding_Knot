/**
 * Central list of all app pages - used for "Add All Pages" in PageMaster.
 * Must stay in sync with routes in Route.tsx.
 */

const formatPageTypeToName = (pageType: string): string => {
  if (!pageType) return "";
  // addEditPageMaster -> Add Edit Page Master, pageMaster -> Page Master
  const withSpaces = pageType.replace(/([A-Z])/g, " $1").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

export interface AppPage {
  pageType: string;
  name: string;
}

/** All page paths (last segment of route path). Sync with Route.tsx */
const PAGE_PATHS = [
  "adminMaster", "addEditAdminMaster", "addEditFirmMasster", "firmMaster",
  "addEditCompanyYears", "companyYears", "addEditCountryMaster", "countryMaster",
  "addEditStateMaster", "stateMaster", "addEditCityMaster", "cityMaster",
  "addEditItemMaster", "itemMaster", "addEditItemGroup", "itemGroup",
  "addEditItemCompany", "itemCompany", "addEditItemType", "itemType",
  "addEditWarehouse", "warehouse", "addEditLedgerMaster", "addEditUnitMaster", "unitMaster",
  "addEditMaterialMaster", "materialMaster", "addEditColorMaster", "colorMaster", "addEditBatchMaster", "batchMaster", "addEditUserMaster", "userMaster",
  "addEditCompanyUserMaster", "addEditPageMaster", "pageMaster", "ledgerMaster",
  "addEditLedgerConsigneeMaster", "ledgerConsigneeMaster", "addEditTaxGroupMaster",
  "addEditCompanyMaster", "companyMaster", "taxGroupMaster", "addEditTaxGroupLedgerMap",
  "taxGroupLedgerMap", "voucherTypeMaster", "addEditVoucherType", "voucherEntry",
  "purchaseOrder", "salesOrder", "fastEntryOfLedgerBalance", "voucherSearch",
  "bankReconcilation", "interestCalculation", "salesInvoice", "ledgerDetailsReport", "trialBalance",
  "trialBalanceDetail", "trialBalanceCompleteDetail", "profitAndLoss", "profitAndLossDetails",
  "balanceSheet",
  "userRights", "changePassword",
];

/** Display names for pages - override formatPageTypeToName where needed */
const PAGE_NAME_OVERRIDES: Record<string, string> = {
  addEditFirmMasster: "Add Edit Firm Master",
  profitAndLoss: "Profit & Loss A/c",
  profitAndLossDetails: "Profit & Loss A/c Detail",
};

export function getAllAppPages(): AppPage[] {
  const seen = new Set<string>();
  return PAGE_PATHS.filter((pt) => {
    if (seen.has(pt)) return false;
    seen.add(pt);
    return true;
  }).map((pageType) => ({
    pageType,
    name: PAGE_NAME_OVERRIDES[pageType] ?? formatPageTypeToName(pageType),
  }));
}
