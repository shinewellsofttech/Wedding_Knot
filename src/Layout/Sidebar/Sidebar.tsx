import { Link } from 'react-router-dom'
import { H6, Image, LI, UL } from '../../AbstractElements'
import { useAppDispatch, useAppSelector } from '../../ReduxToolkit/Hooks'
import LogoWrapper from './LogoWrapper';
import SimpleBar from 'simplebar-react';
import { Back, Pinned } from '../../utils/Constant';
import { dynamicImage } from '../../Service';
import { ArrowLeft, ArrowRight, X } from 'react-feather';
import SidebarMenuList from './SidebarMenuList';
import { scrollToLeft, scrollToRight, setToggleSidebar } from '../../ReduxToolkit/Reducers/LayoutSlice';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { layout } = useAppSelector((state) => state.themeCustomizer);
  const { toggleSidebar, margin } = useAppSelector((state) => state.layout);
  const { pinedMenu } = useAppSelector((state) => state.layout);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = () => {
    // Only apply hover on desktop screens
    if (isDesktop) {
      // Open sidebar on hover
      dispatch(setToggleSidebar(false));
    }
  };

  const handleMouseLeave = () => {
    // Only apply hover on desktop screens
    if (isDesktop) {
      // Close sidebar when mouse leaves
      dispatch(setToggleSidebar(true));
    }
  };

  const showCloseButton = !isDesktop && !toggleSidebar;

  return (
    <div 
      className={`sidebar-wrapper ${toggleSidebar ? "close_icon" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showCloseButton && (
        <>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => dispatch(setToggleSidebar(true))}
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
          <style>{`
            .sidebar-close-btn {
              position: fixed !important;
              top: 18px !important;
              left: 252px !important;
              z-index: 9999 !important;
              width: 40px !important;
              height: 40px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border: none !important;
              border-radius: 8px !important;
              background: rgba(0,0,0,0.1) !important;
              color: inherit !important;
              cursor: pointer !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            }
            .sidebar-close-btn:hover {
              background: rgba(0,0,0,0.15) !important;
            }
            [dir="rtl"] .sidebar-close-btn {
              left: auto !important;
              right: 252px !important;
            }
            .dark-only .sidebar-close-btn {
              background: rgba(255,255,255,0.15) !important;
            }
            .dark-only .sidebar-close-btn:hover {
              background: rgba(255,255,255,0.25) !important;
            }
            @media (max-width: 400px) {
              .sidebar-close-btn { left: calc(100vw - 52px) !important; }
              [dir="rtl"] .sidebar-close-btn { right: calc(100vw - 52px) !important; left: auto !important; }
            }
          `}</style>
        </>
      )}
      <div>
        <LogoWrapper />
        <nav className="sidebar-main">
          <div className={`left-arrow ${margin === 0 ? "disabled" : ""}`} onClick={()=>dispatch(scrollToLeft())}><ArrowLeft /></div>
          <div id="sidebar-menu" style={{ marginLeft : layout === "horizontal-wrapper" ? `${margin}px` : "0px"}}>
            <UL className="sidebar-links" id="simple-bar" >
              <SimpleBar style={{ margin: "0px"}}>
                <LI className="back-btn">
                  <Link to={`${process.env.PUBLIC_URL}/dashboard/defaULt`}>
                    <Image className="img-fluid" src={dynamicImage("logo/logo-icon.png")} alt="logo" />
                  </Link>
                  <div className="mobile-back text-end ">
                    <span>{Back}</span>
                    <i className="fa fa-angle-right ps-2" aria-hidden="true"></i>
                  </div>
                </LI>
                <LI className={`pin-title sidebar-main-title ${pinedMenu.length > 1 ? "show" : ""} `}>
                  <div>
                    <H6>{Pinned}</H6>
                  </div>
                </LI>
              <SidebarMenuList />
              </SimpleBar>
            </UL> 
          </div>
          <div className={`right-arrow ${margin === -3500 ? "disabled" : ""}`} onClick={()=>dispatch(scrollToRight())}><ArrowRight /></div>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar