import { Link } from "react-router-dom";
import Image from "../../CommonElements/Media";
import { dynamicImage } from "../../Service";
import { SVG } from "../../AbstractElements";
import { setToggleSidebar } from "../../ReduxToolkit/Reducers/LayoutSlice";
import { useAppDispatch, useAppSelector } from "../../ReduxToolkit/Hooks";

const HeaderLogo = () => {
  const dispatch = useAppDispatch();
  const {toggleSidebar} = useAppSelector((state)=>state.layout)
  return (
    <div className="header-logo-wrapper col-auto p-0">
      <div className="logo-wrapper">
        <Link to={`${process.env.PUBLIC_URL}/dashboard/default`}>
          <Image
            className="img-fluid for-light"
            src={dynamicImage("logo/logo-1.png")}
            alt="logo"
          />
          <Image
            className="img-fluid for-dark"
            src={dynamicImage("logo/logo.png")}
            alt="logo"
          />
        </Link>
      </div>
      <div className="toggle-sidebar"> 
        <SVG className="sidebar-toggle" iconId="stroke-animation" onClick={()=>dispatch(setToggleSidebar(!toggleSidebar))} /> 
      </div>
    </div>
  );
};

export default HeaderLogo;
