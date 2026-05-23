import React, { useState, useEffect } from "react";
import { LI } from "../../AbstractElements";
import { API_WEB_URLS } from "../../constants/constAPI";

const getDataList = (data: any) =>
  data?.dataList ?? data?.data?.dataList ?? (Array.isArray(data) ? data : []);

const HeaderFYCompany: React.FC = () => {
  const [companyName, setCompanyName] = useState("");
  const [fy, setFy] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchHeaderData = async () => {
      /*
      try {
        const base = API_WEB_URLS.BASE || "https://apiaccountingmain.shinewellinnovation.com/api/V1";
        
        // Fetch Global Options
        const globalOptionsUrl = `${base}${API_WEB_URLS.MASTER}/0/token/GlobalOptions/Id/0`;
        const globalOptionsRes = await fetch(globalOptionsUrl);
        const globalOptionsData = await globalOptionsRes.json();
        
        if (cancelled) return;

        const globalOptionsList = getDataList(globalOptionsData);
        let firmName = "";
        let fyMasterId = "";

        if (Array.isArray(globalOptionsList) && globalOptionsList.length > 0) {
          const firstRecord = globalOptionsList[0];
          firmName = firstRecord.FirmName || "";
          fyMasterId = String(firstRecord.F_FinancialYearMaster || "");
        }

        if (firmName) {
          setCompanyName(firmName.trim());
        }

        // Fetch Company Year Master to map the Financial Year
        if (fyMasterId) {
          const yearMasterUrl = `${base}${API_WEB_URLS.MASTER}/0/token/CompanyYearMaster/Id/0`;
          const yearRes = await fetch(yearMasterUrl);
          const yearData = await yearRes.json();
          
          if (cancelled) return;

          const yearList = getDataList(yearData);
          if (Array.isArray(yearList)) {
            const selectedYear = yearList.find((y: any) => String(y.Id) === fyMasterId);
            if (selectedYear && selectedYear.FinancialYearFrom && selectedYear.FinancialYearTo) {
              const fromYear = new Date(selectedYear.FinancialYearFrom).getFullYear();
              const toYear = new Date(selectedYear.FinancialYearTo).getFullYear();
              setFy(`${fromYear}-${String(toYear % 100).padStart(2, "0")}`);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching header data:", error);
      }
      */
    };

    // fetchHeaderData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LI className="header-fy-company d-none d-md-flex align-items-center flex-nowrap border-end border-2 me-2 pe-2" style={{ background: "none" }}>
      {fy && (
        <>
          <span className="text-muted small me-2">FY</span>
          <span className="fw-semibold small me-3">{fy}</span>
        </>
      )}
      {companyName ? (
        <>
          {fy && <span className="text-muted small me-2">|</span>}
          <span className="text-dark small text-truncate" style={{ maxWidth: "180px" }} title={companyName}>
            {companyName}
          </span>
        </>
      ) : null}
    </LI>
  );
};

export default HeaderFYCompany;
