import { Link } from "react-router-dom";
import Image from "../../../CommonElements/Media";
import { dynamicImage } from "../../../Service";
import { SVG } from "../../../AbstractElements";
import { useAppDispatch, useAppSelector } from "../../../ReduxToolkit/Hooks";
import { setToggleSidebar } from "../../../ReduxToolkit/Reducers/LayoutSlice";

const HeaderLogoWrapper = () => {
  const dispatch = useAppDispatch();
  const {toggleSidebar} = useAppSelector((state)=>state.layout)
  return (
    <div className="header-logo-wrapper col-auto p-0">
      <div className="logo-wrapper">
        <Link to={"/"}>
          <Image className="img-fluid" src={dynamicImage("logo/logo.png")} alt="CrocsLogo" />
        </Link>
      </div>
      <div className="toggle-sidebar">
        <SVG className="stroke-icon sidebar-toggle status_toggle middle" iconId={"toggle-icon"} onClick={()=>dispatch(setToggleSidebar(!toggleSidebar))}></SVG>
      </div>
    </div>
  );
};

export default HeaderLogoWrapper;
