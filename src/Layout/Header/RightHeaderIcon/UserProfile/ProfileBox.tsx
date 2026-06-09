import { Link } from "react-router-dom";
import { FeatherIcons, LI, UL } from "../../../../AbstractElements";
import { profilesMessage } from "../../../../Data/LayoutData/HeaderData";
import { useUserRights } from "../../../../contexts/UserRightsContext";
import { clearUserPermissions } from "../../../../helpers/permissionsHelper";

const ProfileBox = () => {
  const { hasAccess, loadUserRights } = useUserRights();

  const handleClick = (name: string) => {
    if (name === "Log Out") {
      localStorage.removeItem("login");
      localStorage.removeItem("authUser");
      loadUserRights([]);
      clearUserPermissions();
    }
  };

  return (
    <UL className="profile-dropdown onhover-show-div simple-list">
      {/* {hasAccess("UserRights") && (
        <LI>
          <Link to={`${process.env.PUBLIC_URL || ""}/userRights`}>
            <FeatherIcons iconName="Shield" />
            <span>User Rights</span>
          </Link>
        </LI>
      )}
      <LI>
        <Link to={`${process.env.PUBLIC_URL || ""}/changePassword`}>
          <FeatherIcons iconName="Lock" />
          <span>Change Password</span>
        </Link>
      </LI> */}
      {profilesMessage.map((data, index) => (
        <LI key={index}>
          <Link to={data.link} onClick={() => handleClick(data.name)}>
            <FeatherIcons iconName={data.icon} />
            <span>{data.name} </span>
          </Link>
        </LI>
      ))}
    </UL>
  );
};

export default ProfileBox;
