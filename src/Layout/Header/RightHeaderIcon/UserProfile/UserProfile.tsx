import { useState, useEffect } from "react";
import { Image, LI, P } from "../../../../AbstractElements";
import { dynamicImage } from "../../../../Service";
import ProfileBox from "./ProfileBox";

const UserProfile = () => {
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");

  useEffect(() => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const name =
        authUser?.Name ??
        authUser?.UserName ??
        authUser?.Email ??
        authUser?.FullName ??
        "";
      const typeNum = Number(authUser?.F_UserType ?? authUser?.UserType ?? 0);
      const typeLabel = typeNum === 1 ? "Admin" : typeNum === 2 ? "User" : "";
      const typeFromApi =
        authUser?.UserTypeName ?? authUser?.Role ?? authUser?.RoleName ?? "";
      const type = typeLabel || (typeof typeFromApi === "string" ? typeFromApi.trim() : "");
      setUserName(typeof name === "string" ? name.trim() : "");
      setUserType(type);
    } catch {
      setUserName("");
      setUserType("");
    }
  }, []);

  return (
    <LI className="profile-nav onhover-dropdown p-0 header-profile-logout">
      <div className="d-flex profile-media align-items-center">
        <Image className="b-r-10 img-40" src={dynamicImage("dashboard/profile.png")} alt="user" />
        <div className="flex-grow-1">
          <span>{userName || "User"}</span>
          <P className="mb-0">{userType || "—"}</P>
        </div>
      </div>
      <ProfileBox />
    </LI>
  );
};

export default UserProfile;
