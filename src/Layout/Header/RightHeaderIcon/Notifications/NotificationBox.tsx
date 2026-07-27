import { Link } from "react-router-dom";
import { useOrderNotifications } from "../../../../contexts/OrderNotificationContext";
import { ShoppingBag } from "react-feather";

const NotificationBox = () => {
  const { notifications, markAsRead } = useOrderNotifications();

  if (notifications.length === 0) {
    return (
      <div className="p-3 text-center text-muted" style={{ fontSize: "13px" }}>
        No new order notifications
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
      {notifications.map((item) => (
        <div
          className={`d-flex align-items-center p-2 mb-1 rounded ${!item.read ? "bg-light" : ""}`}
          key={item.id}
          onClick={() => markAsRead(item.id)}
          style={{ cursor: "pointer", transition: "background 0.2s" }}
        >
          <div
            className="flex-shrink-0 d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
            style={{ width: "36px", height: "36px" }}
          >
            <ShoppingBag size={18} />
          </div>
          <div className="flex-grow-1 ms-2" style={{ overflow: "hidden" }}>
            <Link to={`${process.env.PUBLIC_URL || ""}/ecommerce/orders`} style={{ textDecoration: "none", color: "inherit" }}>
              <h5 style={{ fontSize: "14px", fontWeight: !item.read ? "bold" : "normal", margin: 0 }}>
                Order {item.entryNo}
              </h5>
              <span className="d-block text-truncate" style={{ fontSize: "12px", color: "#666" }}>
                {item.customerName} ({item.itemCount} item{item.itemCount !== 1 ? "s" : ""})
              </span>
              <span style={{ fontSize: "10px", color: "#999" }}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </Link>
          </div>
          {!item.read && (
            <div className="flex-shrink-0 ms-1">
              <div className="activity-dot-primary" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7366ff" }}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationBox;