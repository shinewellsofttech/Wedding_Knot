import { Badges, H6, LI, SVG } from "../../../../AbstractElements";
import { useOrderNotifications } from "../../../../contexts/OrderNotificationContext";
import NotificationBox from "./NotificationBox";

const Notifications = () => {
  const { unreadCount, markAllAsRead } = useOrderNotifications();

  return (
    <LI className="onhover-dropdown">
      <div className="notification-box" style={{ position: "relative" }}>
        <SVG iconId="fill-Bell" />
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: "-5px", right: "-5px" }}>
            <Badges pill color="danger">
              {unreadCount}
            </Badges>
          </span>
        )}
      </div>
      <div
        className="onhover-show-div notification-dropdown"
        style={{
          zIndex: 99999,
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 35px rgba(0,0,0,0.2)",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          overflow: "hidden"
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2 p-3">
          <H6 className="f-18 mb-0 dropdown-title">Order Notifications</H6>
          {unreadCount > 0 && (
            <span
              style={{ fontSize: "12px", color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              Mark all as read
            </span>
          )}
        </div>
        <div style={{ padding: "0 12px 12px 12px" }}>
          <NotificationBox />
        </div>
      </div>
    </LI>
  );
};

export default Notifications;
