import { Fragment, useState, useMemo, useEffect } from 'react'
import { useAppSelector } from '../../ReduxToolkit/Hooks';
import { MenuList } from '../../Data/LayoutData/SidebarData';
import Menulist from './Menulist';
import { MenuItem } from '../../Types/Layout/SidebarType';
import { H6, LI, UL } from '../../AbstractElements';
import { useTranslation } from 'react-i18next';
import { usePermissions, loadPermissionsFromStorage } from '../../helpers/permissionsHelper';

const SidebarMenuList = () => {
  const [activeMenu, setActiveMenu] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { pinedMenu } = useAppSelector((state) => state.layout);
  const { t } = useTranslation();
  const { permissions, isLoaded } = usePermissions();

  useEffect(() => {
    if (!isLoaded) {
      loadPermissionsFromStorage();
    }
  }, [isLoaded, permissions]);

  const filteredMenuList = useMemo(() => {
    if (isLoaded && (!permissions || permissions.length === 0)) return MenuList;
    if (!isLoaded) return MenuList;

    const filtered = MenuList.map((mainMenu) => {
      const filteredItems = mainMenu.Items?.filter((item) => {
        if (!item.path) return false;
        let cleanPath = item.path.replace(process.env.PUBLIC_URL || "", "");
        if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
        const permission = permissions.find(p => {
          let modulePath = p.ModulePath || "";
          if (!modulePath.startsWith("/")) modulePath = "/" + modulePath;
          return modulePath.toLowerCase() === cleanPath.toLowerCase();
        });
        return permission ? permission.IsView === true : true;
      });
      return { ...mainMenu, Items: filteredItems };
    }).filter((mainMenu) => mainMenu.Items && mainMenu.Items.length > 0);
    return filtered;
  }, [permissions, isLoaded]);

  const shouldHideMenu = (mainMenu: MenuItem) => { 
    return mainMenu?.Items?.map((data) => data.title).every((titles) => pinedMenu.includes(titles || "")); 
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <>
      {filteredMenuList &&
        filteredMenuList.map((mainMenu: MenuItem, index: number) => {
          const isExpanded = expandedSections[mainMenu.title || ""] ?? false;
          return (
            <Fragment key={index}>
              <LI className={`sidebar-main-title ${shouldHideMenu(mainMenu) ? "d-none" : ""}`}>
                <div
                  className="d-flex align-items-center justify-content-between w-100 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSection(mainMenu.title || "")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSection(mainMenu.title || "");
                    }
                  }}
                >
                  <H6 className={`mb-0 flex-grow-1 text-truncate ${mainMenu.lanClass || ""}`}>{t(mainMenu.title)}</H6>
                  <span
                    className="sidebar-chevron-icon ms-2 flex-shrink-0"
                    style={{ fontSize: "12px", lineHeight: 1, opacity: 0.9, color: "#fff" }}
                    aria-hidden
                  >
                    {isExpanded ? "▼" : "▶"}
                  </span>
                </div>
              </LI>
              <UL
                className="sidebar-submenu-collapse list-unstyled"
                style={{
                  maxHeight: isExpanded ? "2000px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.35s ease-in-out, opacity 0.25s ease-in-out",
                  opacity: isExpanded ? 1 : 0,
                  margin: 0,
                  padding: 0,
                }}
              >
                <Menulist menu={mainMenu.Items} activeMenu={activeMenu} setActiveMenu={setActiveMenu} level={0} />
              </UL>
            </Fragment>
          );
        })}
    </>
  );
}

export default SidebarMenuList;