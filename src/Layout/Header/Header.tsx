import { Row } from "reactstrap";
import { useNavigate } from "react-router-dom";
import HeaderLogo from "./HeaderLogo";
import SearchInput from "./SearchInput/SearchInput";
import { useAppSelector } from "../../ReduxToolkit/Hooks";
import RightHeaderIcon from "./RightHeaderIcon/RightHeaderIcon";

const Header = () => {
  const { toggleSidebar, scroll } = useAppSelector((state) => state.layout);
  const navigate = useNavigate();

  const handleMobileLogout = () => {
    localStorage.removeItem("login");
    navigate(`${process.env.PUBLIC_URL || ""}/login`);
  };

  return (
    <Row className={`header-wrapper m-0 ${toggleSidebar ? "close_icon" : ""}`} style={{ display: scroll ? "none" : "" }}>
      <HeaderLogo />
      <SearchInput />
      <RightHeaderIcon />
      <div className="col-auto d-lg-none ms-auto d-flex align-items-center header-mobile-logout">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary header-mobile-logout-btn"
          onClick={handleMobileLogout}
          title="Logout"
        >
          Logout
        </button>
      </div>
    </Row>
  );
};

export default Header;
