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
import { useEffect, useState, useRef } from 'react';

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { layout } = useAppSelector((state) => state.themeCustomizer);
  const { toggleSidebar, margin } = useAppSelector((state) => state.layout);
  const { pinedMenu } = useAppSelector((state) => state.layout);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        // Open sidebar on hover
        dispatch(setToggleSidebar(false));
      }, 150); // Small delay to prevent flickering and lag
    }
  };

  const handleMouseLeave = () => {
    // Only apply hover on desktop screens
    if (isDesktop) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        // Close sidebar when mouse leaves
        dispatch(setToggleSidebar(true));
      }, 150); // Small delay before closing
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
                  <Link to={`${process.env.PUBLIC_URL}/dashboard/default`}>
                    <Image className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/image.png`} alt="logo" />
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
      <style>{`
        /* Premium Dark Sidebar Aesthetics */
        .sidebar-wrapper {
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%) !important;
          box-shadow: 4px 0 24px rgba(0,0,0,0.15) !important;
          border-right: 1px solid rgba(255,255,255,0.05) !important;
          transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        
        .sidebar-wrapper .sidebar-link {
          transition: all 0.3s ease !important;
          border-radius: 8px !important;
          margin: 6px 12px !important;
          padding: 10px 15px !important;
          color: rgba(255, 255, 255, 0.75) !important;
          position: relative;
          overflow: hidden;
        }

        /* Set text and icons to white globally inside sidebar */
        .sidebar-wrapper a, 
        .sidebar-wrapper span, 
        .sidebar-wrapper p, 
        .sidebar-wrapper h6 {
          color: #ffffff !important;
        }
        
        .sidebar-wrapper svg,
        .sidebar-wrapper i {
          color: #ffffff !important;
          stroke: #ffffff !important;
          opacity: 0.8;
          transition: all 0.3s ease !important;
        }

        /* Hover States */
        .sidebar-wrapper .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          transform: translateX(4px) !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .sidebar-wrapper .sidebar-link:hover svg,
        .sidebar-wrapper .sidebar-link:hover i {
          stroke: #ffffff !important;
          opacity: 1 !important;
          transform: scale(1.1);
        }
        
        /* Active Link Styling (if applicable) */
        .sidebar-wrapper .sidebar-link.active {
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4) !important;
        }

        /* Titles */
        .sidebar-wrapper .sidebar-main-title h6 {
          opacity: 0.5;
          letter-spacing: 1.5px;
          font-size: 11px !important;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 5px;
          color: #94a3b8 !important; /* Slightly dim for titles */
        }
        
        /* Collapsed State Adjustments */
        .sidebar-wrapper.close_icon .sidebar-link {
          margin: 6px 8px !important;
          transform: none !important;
          text-align: center;
        }
        
        .sidebar-wrapper.close_icon .sidebar-link:hover {
          transform: translateY(-2px) !important;
          background: rgba(255, 255, 255, 0.12) !important;
        }

        /* Logo Area adjustments */
        .sidebar-wrapper .logo-wrapper,
        .sidebar-wrapper .logo-icon-wrapper {
          background: transparent !important;
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
          box-shadow: none !important;
        }
        
        .sidebar-wrapper .logo-wrapper a h6 {
          color: #ffffff !important;
          letter-spacing: 1px !important;
        }

        .sidebar-wrapper .back-btn {
          background: transparent !important;
        }
      `}</style>
    </div>
  )
}

export default Sidebar