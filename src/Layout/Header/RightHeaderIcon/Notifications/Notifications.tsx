import { Badges, H6, LI, SVG } from "../../../../AbstractElements";
import { Notification } from "../../../../utils/Constant";
import NotificationBox from "./NotificationBox";

const Notifications = () => {
  return (
    <LI className="onhover-dropdown">
      <div className="notification-box">
        <SVG iconId="fill-Bell" />
        <Badges pill color="primary">3</Badges>
      </div>
      <div className="onhover-show-div notification-dropdown">
        <H6 className="f-18 mb-0 dropdown-title">{Notification} </H6>
        <NotificationBox />
      </div>
    </LI>
  );
};

export default Notifications;
