/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../ReduxToolkit/Hooks";
import { Link, useLocation } from "react-router-dom";
import { MenuListType, SidebarItemTypes } from "../../Types/Layout/SidebarType";
import { handlePined } from "../../ReduxToolkit/Reducers/LayoutSlice";
import { LI, UL } from "../../AbstractElements";
import { Href } from "../../utils/Constant";
import { useTranslation } from "react-i18next";

const Menulist: React.FC<MenuListType> = ({ menu,setActiveMenu,activeMenu,level,className}) => {
  const { pinedMenu } = useAppSelector((state) => state.layout);
  const location = useLocation();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const ActiveNavLinkUrl = (path?: string, active?: boolean) => {
    return location.pathname === path ? (active ? active : true) : "";
  };

  const shouldSetActive = ({ item }: SidebarItemTypes) => {
    var returnValue = false;
    if (item?.path === location.pathname) returnValue = true;
    if (!returnValue && item?.children) {
      item?.children.every((subItem) => {
        returnValue = shouldSetActive({ item: subItem });
        return !returnValue;
      });
    }
    return returnValue;
  };
  const handleClick = ((item: string) => {
    const temp = activeMenu;
    temp[level] = item !== temp[level] ? item : "";
    setActiveMenu([...temp]);
  })
  useEffect(() => {
    menu?.forEach((item: any) => {
      let gotValue = shouldSetActive({ item });
      if (gotValue) {
        let temp = [...activeMenu];
        temp[level] = item.title;
        setActiveMenu(temp);
      }
    });
  }, []);

  return (
    <>
        {menu?.map((item, index) => (
          <LI
            key={index}
            className={`${level === 0 ? "sidebar-list" : ""} ${ pinedMenu.includes(item.title || "") ? "pined" : ""}  
            ${(item.children
                ? item.children.map((innerItem) => ActiveNavLinkUrl(innerItem.path)).includes(true)
                : ActiveNavLinkUrl(item.path)) || activeMenu[level] === item.title
                ? "active"
                : ""
            } `}
          >
            {level === 0 && (<i className="fa fa-thumb-tack" onClick={() => dispatch(handlePined(item.title))} ></i>)}
            <Link
              className={`${!className && level !== 2 ? "sidebar-link sidebar-title" : ""} 
              ${(item.children
                  ? item.children.map((innerItem) => ActiveNavLinkUrl(innerItem.path)).includes(true)
                  : ActiveNavLinkUrl(item.path)) || activeMenu[level] === item.title ? "active" : ""
              }`}
              to={item.path ? item.path : Href }
              onClick={() => handleClick(item.title)}
            >
              <span className={item.lanClass && item.lanClass}>{t(item.title)}</span>
              {item.children && (activeMenu[level] === item.title ? (
                <div className="according-menu">
                  <i className="fa fa-angle-down" />
                </div>
              ) : (
                <div className="according-menu">
                  <i className="fa fa-angle-right" />
                </div>
              ))}
            </Link>
            {item.children && (
              <UL className={`simple-list ${ level !== 0 ? "nav-sub-childmenu submenu-content" : "sidebar-submenu " }`}
                style={{
                  display: `${
                    (item.children
                      ? item.children.map((innerItem) => ActiveNavLinkUrl(innerItem.path)).includes(true) : ActiveNavLinkUrl(item.path)) || activeMenu[level] === item.title ? "block" : "none"
                  }`
                }}
              >
                <Menulist menu={item.children} activeMenu={activeMenu} setActiveMenu={setActiveMenu} level={level + 1} className="sidebar-submenu" />
              </UL>
            )}
          </LI>
        ))}
        </>
  );
};

export default Menulist;