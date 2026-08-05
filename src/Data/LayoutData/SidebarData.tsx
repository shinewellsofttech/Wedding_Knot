import { MenuItem } from "../../Types/Layout/SidebarType";

export const MenuList: MenuItem[] = [
  {
    title: "Dashboard",
    Items: [
      {
        id: 0,
        title: "Dashboard",
        path: `${process.env.PUBLIC_URL}/dashboard`,
        icon: "Home",
        type: "link",
        bookmark: true
      }
    ]
  },
  {
    title: "Masters",
    Items:[
      // {
      //   id:1,
      //   title: "Item Master", 
      //   path: `${process.env.PUBLIC_URL}/addEditItemMaster  `, 
      //   icon: "Box", 
      //   type: "link", 
      //   bookmark: true 
      // },
      {
        id: 2, title: "Item Master ",
        path: `${process.env.PUBLIC_URL}/itemMaster`,
        icon: "Box",
        type: "link",
        bookmark: true

      },
      {
        id: 3, title: "Category Master",
        path: `${process.env.PUBLIC_URL}/categoryMaster`,
        icon: "Box",
        type: "link",
        bookmark: true

      },
      {
        id: 99, title: "Barcode Templates",
        path: `${process.env.PUBLIC_URL}/barcodeTemplate`,
        icon: "Barcode",
        type: "link",
        bookmark: true
      },
      {
        id: 4, title: "User Master",
        path: `${process.env.PUBLIC_URL}/userMaster`,
        icon: "User",
        type: "link",
        bookmark: true

      },
      {
        id: 400, title: "Website Leads",
        path: `${process.env.PUBLIC_URL}/websiteLeads`,
        icon: "UserCheck",
        type: "link",
        bookmark: true
      },
      {
        id: 1,
        title: "Material Master",
        path: `${process.env.PUBLIC_URL}/materialMaster`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
      
            { 
        id: 2, 
        title: "Ledger Master", 
        path: `${process.env.PUBLIC_URL}/ledgerMaster`, 
        icon: "building", 
        type: "link", 
        bookmark: true 
      },
      {
        id: 5,
        title: "State Master",
        path: `${process.env.PUBLIC_URL}/stateMaster`,
        icon: "User",
        type: "link",
        bookmark: true
      },
      {
        id: 6,
        title: "City Master",
        path: `${process.env.PUBLIC_URL}/cityMaster`,
        icon: "User",
        type: "link",
        bookmark: true
      },
      {
        id:7,
        title: "Financial Year Master",
        path: `${process.env.PUBLIC_URL}/companyYears`,
        icon: "Calendar",
        type: "link",
        bookmark: true
      },
       {
        id: 1,
        title: "Voucher Type",
        path: `${process.env.PUBLIC_URL}/voucherTypeMaster`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
      {
        id: 8,
        title: "User Role Master",
        path: `${process.env.PUBLIC_URL}/userRoleMaster`,
        icon: "User",
        type: "link",
        bookmark: true
      },
      {
        id: 9,
        title: "Module Master",
        path: `${process.env.PUBLIC_URL}/moduleMaster`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
      // {
      //   id: 5, title: "Tax Group Master",
      //   path: `${process.env.PUBLIC_URL}/taxGroupMaster`,
      //   icon: "User",
      //   type: "link",
      //   bookmark: true

      // }
    ] 

  },
  {
    title: "Transactions",
    Items:[
      {
        id:1,
        title: "Purchase Entry", 
        path: `${process.env.PUBLIC_URL}/purchaseEntry`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      {
        id: 2, title: "Sales Invoice",
        path: `${process.env.PUBLIC_URL}/salesInvoice`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
       {
        id: 3,
        title: "Sales Return",
        path: `${process.env.PUBLIC_URL}/salesReturn`,
        icon: "Box",
        type: "link",
        bookmark: true
      }, {
        id: 4,
        title: "Purchase Return",
        path: `${process.env.PUBLIC_URL}/purchaseReturn`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
      {
        id: 5,
        title: "Money Receipt",
        path: `${process.env.PUBLIC_URL}/moneyReceipt`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
      {
        id: 6,
        title: "Money Payment",
        path: `${process.env.PUBLIC_URL}/moneyPayment`,
        icon: "Box",
        type: "link",
        bookmark: true
      }
    ]
  },
  {
    title:"Rent Management",
    Items:[
      {
        id:1,
        title:"Rent Management",
        path:`${process.env.PUBLIC_URL}/rentManagement`,
        icon:"Box",
        type:"link",
        bookmark:true
      },
      {
        id:2,
        title:"Rent Return",
        path:`${process.env.PUBLIC_URL}/rentReturn`,
        icon:"Box",
        type:"link",
        bookmark:true
      }
    ]
  },
  {
title:"Accounting",
Items:[
  {
    id:1,
    title:"Voucher Entry",
    path:`${process.env.PUBLIC_URL}/voucherEntry`,
    icon:"Box",
    type:"link",
    bookmark:true
  }
]
  },
  {
    title:"Reports",
    Items:[
      {
        id:1,
        title:"Ledger Details Report",
        path:`${process.env.PUBLIC_URL}/ledgerDetailsReport`,
        icon:"Box",
        type:"link",
        bookmark:true
      },
      {
        id: 1.2,
        title: "Cash Report",
        path: `${process.env.PUBLIC_URL}/cashReport`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
      {
        id: 1.5,
        title: "Stock Report",
        path: `${process.env.PUBLIC_URL}/stockReport`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
        {
        id:2,
        title: "Trial Balance",
        path: `${process.env.PUBLIC_URL}/trialBalance`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
      {
        id: 3,
        title:"Profit & Loss",
        path:`${process.env.PUBLIC_URL}/profitAndLoss`,
        icon:"Box",
        type:"link",
        bookmark:true
      },
      {
        id:4,
        title:"Balance Sheet",
        path:`${process.env.PUBLIC_URL}/balanceSheet`,
        icon:"Box",
        type:"link",
        bookmark:true
      },
      // {
      //   id:5,
      //   title:"Stock Position",
      //   path:`${process.env.PUBLIC_URL}/stockPositionReport`,
      //   icon:"Box",
      //   type:"link",
      //   bookmark:true
      // },
      {
        id:6,
        title:"Outstanding Report",
        path:`${process.env.PUBLIC_URL}/customerOutstandingReport`,
        icon:"Users",
        type:"link",
        bookmark:true
      }
    ]
  },
  {
    title: "Ecommerce",
    Items: [
      {
        id: 1,
        title: "Orders",
        path: `${process.env.PUBLIC_URL}/orders`,
        icon: "Box",
        type: "link",
        bookmark: true
      },
      {
        id: 2,
        title: "Blog Master",
        path: `${process.env.PUBLIC_URL}/blogMaster`,
        icon: "Box",
        type: "link",
        bookmark: true
      }
    ]
  },
   {
    title: "Tools",
    Items: [
      // { id: 1, title: "User Rights", path: `${process.env.PUBLIC_URL}/userRights`, icon: "Shield", type: "link", bookmark: true },
      { id: 2, title: "Global Options", path: `${process.env.PUBLIC_URL}/globalOptions`, icon: "Settings", type: "link", bookmark: true },
      { id: 3, title: "Permission Matrixs", path: `${process.env.PUBLIC_URL}/permissionMetrixs`, icon: "Settings", type: "link", bookmark: true },
    ],  
  },
  /*
  {
    title: "Dashboard",
    Items: [{ id: 1, title: "Voucher Entry", path: `${process.env.PUBLIC_URL}/voucherEntry`, icon: "home", type: "link", bookmark: true }],
  },
  {
    title: "Masters",
    Items: [
      { 
        id: 1, 
        title: "Admin Master", 
        path: `${process.env.PUBLIC_URL}/adminMaster`, 
        icon: "User", 
        type: "link", 
        bookmark: true 
      },

      { 
        id: 2, 
        title: "Ledger Master", 
        path: `${process.env.PUBLIC_URL}/ledgerMaster`, 
        icon: "building", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 3, 
        title: "Ledger Consignee Master", 
        path: `${process.env.PUBLIC_URL}/ledgerConsigneeMaster`, 
        icon: "building", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 4, 
        title: "Firm Master", 
        path: `${process.env.PUBLIC_URL}/firmMaster`, 
        icon: "building", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 5, 
        title: "Country Master", 
        path: `${process.env.PUBLIC_URL}/countryMaster`, 
        icon: "Globe", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 6, 
        title: "Company Years", 
        path: `${process.env.PUBLIC_URL}/companyYears`, 
        icon: "Calendar", 
        type: "link", 
        bookmark: true 
      },
      
      { 
        id: 7, 
        title: "State Master", 
        path: `${process.env.PUBLIC_URL}/stateMaster`, 
        icon: "Map-Pin", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 8, 
        title: "City Master", 
        path: `${process.env.PUBLIC_URL}/cityMaster`, 
        icon: "City", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 9, 
        title: "Item Master", 
        path: `${process.env.PUBLIC_URL}/itemMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 10, 
        title: "Item Group", 
        path: `${process.env.PUBLIC_URL}/itemGroup`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 11, 
        title: "Item Company", 
        path: `${process.env.PUBLIC_URL}/itemCompany`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 12, 
        title: "Item Type", 
        path: `${process.env.PUBLIC_URL}/itemType`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 13, 
        title: "Warehouse", 
        path: `${process.env.PUBLIC_URL}/warehouse`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 14, 
        title: "Unit Master", 
        path: `${process.env.PUBLIC_URL}/unitMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 14.5, 
        title: "Material Master", 
        path: `${process.env.PUBLIC_URL}/materialMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 15, 
        title: "Color Master", 
        path: `${process.env.PUBLIC_URL}/colorMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 16, 
        title: "User Master", 
        path: `${process.env.PUBLIC_URL}/userMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 17, 
        title: "Page Master", 
        path: `${process.env.PUBLIC_URL}/pageMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 17, 
        title: "Tax Group Master", 
        path: `${process.env.PUBLIC_URL}/taxGroupMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 18, 
        title: "Tax Group Ledger Map", 
        path: `${process.env.PUBLIC_URL}/taxGroupLedgerMap`, 
        icon: "Link", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 19, 
        title: "Company Master", 
        path: `${process.env.PUBLIC_URL}/companyMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 20, 
        title: "Voucher Type", 
        path: `${process.env.PUBLIC_URL}/voucherTypeMaster`, 
        icon: "FileText", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 21, 
        title: "Company User Master", 
        path: `${process.env.PUBLIC_URL}/addEditCompanyUserMaster`, 
        icon: "Box", 
        type: "link", 
        bookmark: true 
      },
      {
        id:22, 
        title:"Batch Master",
        path: `${process.env.PUBLIC_URL}/batchMaster`,
        icon: "Box",
        type: "link",
        bookmark: true

      }
    ],

  },
  {
    title: "Transactions",
    Items: [
      { id: 1, title: "Voucher Entry", path: `${process.env.PUBLIC_URL}/voucherEntry`, icon: "Paper-plus", type: "link", bookmark: true },
      { id: 5, title: "Fast Entry Of Ledger Balance", path: `${process.env.PUBLIC_URL}/fastEntryOfLedgerBalance`, icon: "Box", type: "link", bookmark: true },
      { id: 6, title: "Voucher Search", path: `${process.env.PUBLIC_URL}/voucherSearch`, icon: "Box", type: "link", bookmark: true },
      { id: 7, title: "Bank Reconcilation", path: `${process.env.PUBLIC_URL}/bankReconcilation`, icon: "Box", type: "link", bookmark: true },
      { id: 8, title: "Interest Calculation", path: `${process.env.PUBLIC_URL}/interestCalculation`, icon: "Box", type: "link", bookmark: true },
    ],
  },
  {
    title:"Inventory",
    Items: [
      { id: 2, title: "Purchase Order", path: `${process.env.PUBLIC_URL}/purchaseOrder`, icon: "Box", type: "link", bookmark: true },
      { id: 3, title: "Purchase Order Approval", path: `${process.env.PUBLIC_URL}/purchaseOrderApproval`, icon: "Box", type: "link", bookmark: true },
      { id: 4, title: "Purchase Entry", path: `${process.env.PUBLIC_URL}/purchaseEntry`, icon: "Box", type: "link", bookmark: true },
      { id: 5, title: "Sales Order", path: `${process.env.PUBLIC_URL}/salesOrder`, icon: "Box", type: "link", bookmark: true },
      { id: 6, title: "Sales Order Approval", path: `${process.env.PUBLIC_URL}/salesOrderApproval`, icon: "Box", type: "link", bookmark: true },
      { id: 7, title: "Sales Invoice", path: `${process.env.PUBLIC_URL}/salesInvoice`, icon: "Truck", type: "link", bookmark: true },
      // { id: 8, title: "Purchase Return", path: `${process.env.PUBLIC_URL}/purchaseReturn`, icon: "Box", type: "link", bookmark: true },
    ]
  },
  {
    title: "Reports",
    Items: [
      { id: 1, title: "Ledger Details Report", path: `${process.env.PUBLIC_URL}/ledgerDetailsReport`, icon: "Box", type: "link", bookmark: true },
      { id: 2, title: "Trial Balance", path: `${process.env.PUBLIC_URL}/trialBalance`, icon: "Box", type: "link", bookmark: true },
      { id: 3, title: "Trial Balance (Detail)", path: `${process.env.PUBLIC_URL}/trialBalanceDetail`, icon: "Box", type: "link", bookmark: true },
      { id: 4, title: "Trial Balance (Complete Detail)", path: `${process.env.PUBLIC_URL}/trialBalanceCompleteDetail`, icon: "Box", type: "link", bookmark: true },
      { id: 5, title: "Profit & Loss A/c", path: `${process.env.PUBLIC_URL}/profitAndLoss`, icon: "DollarSign", type: "link", bookmark: true },
      { id: 6, title: "Profit & Loss Details", path: `${process.env.PUBLIC_URL}/profitAndLossDetails`, icon: "DollarSign", type: "link", bookmark: true },
      { id: 7, title: "Balance Sheet (Traditional)", path: `${process.env.PUBLIC_URL}/balanceSheet`, icon: "FileText", type: "link", bookmark: true },
      { id: 8, title: "Balance Sheet (Standard)", path: `${process.env.PUBLIC_URL}/balanceSheetStandard`, icon: "FileText", type: "link", bookmark: true },
      { id: 9, title: "Balance Sheet (Detailed)", path: `${process.env.PUBLIC_URL}/balanceSheetDetailed`, icon: "FileText", type: "link", bookmark: true },
      { id: 10, title: "Group Ledger Summary", path: `${process.env.PUBLIC_URL}/groupLedgerSummary`, icon: "FileText", type: "link", bookmark: true },
    ],
  },

  {
    title: "Tools",
    Items: [
      { id: 1, title: "User Rights", path: `${process.env.PUBLIC_URL}/userRights`, icon: "Shield", type: "link", bookmark: true },
      { id: 2, title: "Global Options", path: `${process.env.PUBLIC_URL}/globalOptions`, icon: "Settings", type: "link", bookmark: true },
    ],
  },
  */
];              