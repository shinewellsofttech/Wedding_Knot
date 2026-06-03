/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../ReduxToolkit/Hooks"
import { useUserRights } from "../contexts/UserRightsContext"
import { Fn_FillListData } from "../store/Functions"
import { API_WEB_URLS } from "../constants/constAPI"
import { setToggleSidebar } from "../ReduxToolkit/Reducers/LayoutSlice"
import { setLayout } from "../ReduxToolkit/Reducers/ThemeCustomizerSlice"
import Footer from "./Footer/Footer"
import Header from "./Header/Header"
import Loader from "./Loader/Loader"
import Sidebar from "./Sidebar/Sidebar"
import TapTop from "./TapTop/TapTop"
import ThemeCustomizer from "./ThemeCustomizer/ThemeCustomizer"
import { Outlet } from "react-router-dom"

const Layout = () => {
  const {layout} = useAppSelector((state)=>state.themeCustomizer)
  const {toggleSidebar,scroll} = useAppSelector((state)=>state.layout)
  const dispatch = useAppDispatch()
  const { loadUserRights } = useUserRights();
  

  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
    const userId = authUser?.Id ?? authUser?.uid
    if (!userId) return
    const fetchRights = async () => {
      /*
      try {
        const rightsRes = await Fn_FillListData(
          dispatch,
          () => {},
          "gridData",
          `${API_WEB_URLS.MASTER}/0/token/UserRightsById/Id/${userId}`
        )
        const rightsList = Array.isArray(rightsRes) ? rightsRes : []
        const pageList = await Fn_FillListData(
          dispatch,
          () => {},
          "gridData",
          `${API_WEB_URLS.MASTER}/0/token/PageMaster/Id/0`
        )
        const pages = Array.isArray(pageList) ? pageList : []
        const pageMap = Object.fromEntries(pages.map((p) => [String(p.Id), p]))
        const merged = rightsList.map((r) => {
          const pageId = String(r.F_PageMaster ?? r.PageID ?? r.Id)
          const page = pageMap[pageId]
          return { ...r, Name: r.Name ?? page?.Name, PageType: r.PageType ?? page?.PageType }
        })
        loadUserRights(merged)
      } catch {
        loadUserRights([])
      }
      */
    }
    // fetchRights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])
  const compactSidebar = () => {
    let windowWidth = window.innerWidth;
    if (layout === "compact-wrapper") {
      if (windowWidth < 1200 ) {
        dispatch(setToggleSidebar(true))
      } 
      else {
        dispatch(setToggleSidebar(false))
      }
    }else if(layout === "horizontal-wrapper") {
      if (windowWidth < 992 ) {
        dispatch(setToggleSidebar(true))
        dispatch(setLayout("compact-wrapper"))
      } 
      else {
        dispatch(setToggleSidebar(false))
        dispatch(setLayout(localStorage.getItem("layout")))
      }
    }
  }; 
  useEffect(() => {
    compactSidebar();
    window.addEventListener("resize", () => {
      compactSidebar();
    });
  }, [layout]);
  return (
    <>
      <style>{`
        /* ===== GLOBAL COMPACT SPACING - minimize vertical space ===== */
        .page-body {
          padding-top: 4px !important;
          padding-bottom: 0 !important;
        }
        .page-body .container-fluid {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        .page-title {
          padding-top: 4px !important;
          padding-bottom: 4px !important;
        }
        .page-body .card {
          margin-bottom: 6px !important;
        }
        .page-body .card .card-header {
          padding: 6px 10px !important;
        }
        .page-body .card .card-body {
          padding: 6px 10px !important;
        }
        .page-body .card .card-footer {
          padding: 4px 10px !important;
        }
        .page-body .card .card-header h5,
        .page-body .card .card-header .card-title {
          font-size: 0.9rem !important;
          margin-bottom: 0 !important;
        }
        .page-body .theme-form .row.g-3,
        .page-body .theme-form .row.g-2,
        .page-body .row.g-3,
        .page-body .row.g-2 {
          --bs-gutter-y: 0.25rem;
        }
        .page-body .theme-form .form-label,
        .page-body .theme-form label,
        .page-body .form-label,
        .page-body label:not(.btn) {
          margin-bottom: 0.1rem !important;
          font-size: 0.8rem;
        }
        .page-body .theme-form .form-group,
        .page-body .form-group {
          margin-bottom: 0.25rem !important;
        }
        .page-body .theme-form .form-control,
        .page-body .theme-form input,
        .page-body .theme-form select,
        .page-body .theme-form textarea,
        .page-body .form-control,
        .page-body input.form-control,
        .page-body select.form-control {
          padding: 0.2rem 0.4rem !important;
          font-size: 0.82rem;
          height: auto;
          min-height: 0;
        }
        .page-body .mb-3 {
          margin-bottom: 0.35rem !important;
        }
        .page-body .mb-2 {
          margin-bottom: 0.2rem !important;
        }
        .page-body .mt-3 {
          margin-top: 0.35rem !important;
        }
        .page-body .mt-2 {
          margin-top: 0.2rem !important;
        }
        .page-body .py-3 {
          padding-top: 0.35rem !important;
          padding-bottom: 0.35rem !important;
        }
        .page-body .py-2 {
          padding-top: 0.2rem !important;
          padding-bottom: 0.2rem !important;
        }
        .page-body .table th,
        .page-body .table td {
          padding: 0.2rem 0.4rem !important;
          font-size: 0.82rem;
          vertical-align: middle;
        }
        .page-body .table thead th {
          padding: 0.25rem 0.4rem !important;
        }
        .page-body .btn {
          padding: 0.2rem 0.6rem;
          font-size: 0.8rem;
        }
        .page-body .btn-sm {
          padding: 0.15rem 0.4rem;
          font-size: 0.75rem;
        }
        .footer {
          padding: 2px 15px !important;
        }
        .footer p {
          font-size: 0.75rem;
          margin-bottom: 0;
        }
        .breadcrumb {
          margin-bottom: 0 !important;
          padding: 0 !important;
        }
        .page-header .header-wrapper {
          padding: 6px 20px !important;
        }
        @media (max-width: 991.98px) {
          .page-header .header-wrapper {
            overflow: visible !important;
            flex-wrap: nowrap !important;
          }
          .page-header .header-wrapper .nav-right .nav-menus {
            flex-wrap: nowrap !important;
          }
          .page-header .header-wrapper .nav-right .header-profile-logout {
            display: inline-block !important;
            visibility: visible !important;
            flex-shrink: 0 !important;
            min-width: 44px !important;
          }
          .page-header .header-wrapper .nav-right .header-profile-logout .profile-media {
            display: flex !important;
            align-items: center !important;
          }
          .page-header .header-wrapper .nav-right .header-profile-logout .profile-media .flex-grow-1 {
            display: none !important;
          }
          .page-header .header-wrapper .nav-right .header-profile-logout .profile-media img {
            width: 36px !important;
            height: 36px !important;
          }
          .page-header .header-wrapper .nav-right.right-header {
            overflow: visible !important;
            flex: 0 0 auto !important;
          }
        }
        @media (max-width: 575.98px) {
          .page-header .header-wrapper .nav-right ul.nav-menus > li:not(.header-profile-logout) {
            margin-right: 6px !important;
          }
          .page-header .header-wrapper .nav-right .header-profile-logout {
            margin-right: 0 !important;
          }
        }
        .header-mobile-logout {
          padding-left: 8px;
        }
        .header-mobile-logout-btn {
          font-size: 0.8rem !important;
          padding: 0.35rem 0.6rem !important;
          white-space: nowrap;
        }
        .page-header .header-wrapper .nav-right .header-fy-company {
          background: none !important;
          background-color: transparent !important;
        }
        /* Sticky table headers must stay below navbar (z-index 8) and sidebar (z-index 9) */
        .page-body table thead[style*="sticky"] {
          z-index: 1 !important;
        }
        /* Reports & tables: horizontal scroll on any viewport when content is wide */
        .page-body .table-responsive {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
        /* Reports: responsive tweaks for small screens */
        @media (max-width: 767.98px) {
          .report-page .card .card-header .card-title {
            font-size: 1rem !important;
          }
          .report-page .card .card-body > h5 {
            font-size: 0.95rem !important;
          }
          .report-page .card .card-body > p.text-muted {
            font-size: 0.8rem !important;
          }
          .report-page .card-footer {
            flex-wrap: wrap;
            gap: 0.35rem;
            justify-content: flex-end;
          }
          .report-page .card-footer .btn {
            margin-bottom: 0;
            margin-left: 0;
            margin-right: 0;
          }
        }
        @media (max-width: 575.98px) {
          .report-page .card .card-body > h5 {
            font-size: 0.9rem !important;
          }
          .report-page .card .card-body .table-responsive {
            margin-left: -0.4rem !important;
            margin-right: -0.4rem !important;
          }
        }
        /* Global master forms: better mobile & tablet spacing */
        @media (max-width: 991.98px) {
          .page-body .card {
            margin-bottom: 0.35rem;
          }
          .page-body .card-body {
            padding: 0.4rem 0.5rem;
          }
          .page-body .card-footer {
            padding: 0.25rem 0.5rem;
          }
          .page-body .theme-form .form-label,
          .page-body .theme-form label {
            font-size: 0.8rem;
            margin-bottom: 0.15rem;
          }
          .page-body .theme-form .form-control,
          .page-body .theme-form input,
          .page-body .theme-form select,
          .page-body .theme-form textarea {
            font-size: 0.8rem;
            padding: 0.25rem 0.45rem;
          }
          .page-body .theme-form .row.g-3,
          .page-body .theme-form .row.g-2 {
            --bs-gutter-y: 0.35rem;
            --bs-gutter-x: 0.35rem;
          }
        }
        @media (max-width: 767.98px) {
          .page-body .card-body {
            padding: 0.6rem 0.6rem;
          }
          .page-body .card-footer {
            padding: 0.4rem 0.55rem;
          }
          .page-body .theme-form .form-label,
          .page-body .theme-form label {
            font-size: 0.75rem;
          }
          .page-body .theme-form .form-control,
          .page-body .theme-form input,
          .page-body .theme-form select,
          .page-body .theme-form textarea {
            font-size: 0.75rem;
            padding: 0.2rem 0.4rem;
          }
        }
        /* PageList (Masters list) responsive */
        @media (max-width: 991.98px) {
          .page-body .container-fluid {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
          .page-body .card .card-body {
            padding: 0.5rem 0.5rem !important;
          }
          .page-body .card .card-body > .row.mb-3 {
            margin-bottom: 0.5rem !important;
          }
          .page-body .card .card-body > .row.mb-3 > [class*="col-"] {
            margin-bottom: 0.35rem;
          }
          .page-body .card .card-body > .row.mb-3 .text-end {
            text-align: left !important;
          }
          .page-body .table-responsive {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            margin-left: -0.25rem;
            margin-right: -0.25rem;
          }
          .page-body .table-responsive table {
            font-size: 0.8rem;
            margin-bottom: 0;
          }
          .page-body .table-responsive th,
          .page-body .table-responsive td {
            padding: 0.35rem 0.5rem;
          }
          .page-body .table-responsive td:last-child,
          .page-body .table-responsive th:last-child {
            white-space: nowrap;
          }
          .page-body .table-responsive .btn-sm {
            padding: 0.2rem 0.4rem;
            font-size: 0.75rem;
          }
        }
        @media (max-width: 767.98px) {
          .page-body {
            overflow-x: hidden !important;
            max-width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .page-body .container-fluid {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
            max-width: 100% !important;
          }
          .page-body .card {
            max-width: 100% !important;
          }
          .page-body .card .card-body {
            padding: 0.5rem 0.5rem !important;
          }
          .page-body .table-responsive th,
          .page-body .table-responsive td {
            padding: 0.3rem 0.4rem;
            font-size: 0.75rem;
          }
          .page-body .table-responsive .btn-sm {
            padding: 0.25rem 0.4rem;
            font-size: 0.75rem;
            min-height: 36px;
          }
        }
        @media (max-width: 575.98px) {
          .page-body .container-fluid {
            padding-left: 0.4rem !important;
            padding-right: 0.4rem !important;
          }
          .page-body .card .card-body {
            padding: 0.4rem 0.4rem !important;
          }
          .page-body .card-header,
          .page-body .card .card-header {
            padding: 0.5rem 0.5rem !important;
          }
          .page-body .card-header .card-title,
          .page-body .card .card-header .card-title {
            font-size: 0.95rem !important;
          }
          .page-body .breadcrumb {
            padding-left: 0 !important;
            padding-right: 0 !important;
            font-size: 0.8rem !important;
          }
          .page-body .table-responsive {
            margin-left: -0.4rem !important;
            margin-right: -0.4rem !important;
            padding-left: 0.15rem !important;
            padding-right: 0.15rem !important;
          }
          .page-body .table-responsive th,
          .page-body .table-responsive td {
            padding: 0.25rem 0.3rem !important;
            font-size: 0.7rem !important;
          }
          .page-body .table-responsive .btn-sm {
            padding: 0.2rem 0.35rem !important;
            font-size: 0.7rem !important;
          }
        }
        .page-body-wrapper div.sidebar-wrapper {
          position: fixed !important;
          top: 0 !important;
          bottom: 0 !important;
          height: 100vh !important;
          max-height: 100vh !important;
          overflow: hidden !important;
        }
        .page-body-wrapper div.sidebar-wrapper > div {
          height: 100% !important;
          max-height: 100vh !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .page-body-wrapper div.sidebar-wrapper .sidebar-main {
          flex: 1 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          min-height: 0 !important;
        }
        .page-body-wrapper div.sidebar-wrapper .sidebar-main .sidebar-links {
          height: 100% !important;
          max-height: calc(100vh - 80px) !important;
          overflow: auto !important;
          flex: 1 !important;
          min-height: 0 !important;
        }
        .page-body-wrapper div.sidebar-wrapper .logo-wrapper,
        .page-body-wrapper div.sidebar-wrapper .logo-icon-wrapper {
          flex-shrink: 0 !important;
        }
        .sidebar-submenu-collapse {
          list-style: none !important;
        }
        .sidebar-submenu-collapse > li.sidebar-list {
          position: relative;
          padding: 2px 0 !important;
          background-color: transparent;
        }
        .sidebar-submenu-collapse > li.sidebar-list > a.sidebar-link {
          display: flex !important;
          align-items: center;
          padding: 4px 15px 4px 18px !important;
          margin: 0 3px;
          line-height: 1.4;
          border-radius: 5px;
        }
        .sidebar-submenu-collapse > li.sidebar-list > a.sidebar-link svg,
        .sidebar-submenu-collapse > li.sidebar-list > a.sidebar-link .stroke-icon,
        .sidebar-submenu-collapse > li.sidebar-list > a.sidebar-link .fill-icon {
          min-width: 22px !important;
          width: 22px !important;
          flex-shrink: 0 !important;
          margin-right: 12px !important;
        }
        .sidebar-wrapper.close_icon .sidebar-submenu-collapse .sidebar-link span {
          display: none !important;
        }
        .sidebar-wrapper.close_icon .sidebar-main-title,
        .sidebar-wrapper.close_icon .sidebar-submenu-collapse {
          display: none !important;
        }
        @media (max-width: 767.98px) {
          .page-body-wrapper {
            overflow-x: hidden !important;
          }
          .page-body-wrapper > .container-fluid,
          .page-body-wrapper > div[class*="container"] {
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
        }
      `}</style>
      <Loader />
      <TapTop />
      <div className={`page-wrapper ${layout}`}>
        <div className={`page-header ${toggleSidebar ? "close_icon" : ""}`} style={{display: scroll ? "none" : ""}}>
          <Header />
        </div>
        <div className={`page-body-wrapper ${scroll ? "scorlled" : ""}`}>
          <Sidebar />
          <Outlet />
          <Footer />
        </div>
      </div>
      <ThemeCustomizer />
    </>
  )
}

export default Layout