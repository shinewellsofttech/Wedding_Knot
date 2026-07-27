import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { toast } from "react-toastify";
import { API_WEB_URLS } from "../constants/constAPI";

export interface OrderNotificationItem {
  id: string;
  orderId: number;
  entryNo: string;
  customerName: string;
  contactMobile: string;
  totalTax: number;
  itemCount: number;
  entryDate: string;
  timestamp: Date;
  read: boolean;
}

interface OrderNotificationContextType {
  notifications: OrderNotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  playNotificationSound: () => void;
  fetchOrdersCheck: () => Promise<void>;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

// Web Audio API notification sound generator (Pleasant two-tone chime)
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second higher tone (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

export const OrderNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<OrderNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const knownOrderIdsRef = useRef<Set<number>>(new Set());
  const isInitializedRef = useRef<boolean>(false);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const fetchOrdersCheck = async () => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      const userToken = authUser?.Token ?? authUser?.token;
      if (!userToken) return;

      const payload = new FormData();
      payload.append("UserId", "0");

      const response = await fetch(`${API_WEB_URLS.BASE}EccomOrder/AdminGetOrders/0/${userToken}`, {
        method: "POST",
        body: payload
      });

      if (!response.ok) return;

      const data = await response.json();
      if (!data?.success || !data?.data) return;

      const rawOrders: any[] = Array.isArray(data.data.orders)
        ? data.data.orders
        : Array.isArray(data.data)
        ? data.data
        : [];

      if (!isInitializedRef.current) {
        // Initial run: record existing order IDs as baseline without alerting
        rawOrders.forEach(o => {
          if (o.Id) knownOrderIdsRef.current.add(Number(o.Id));
        });
        isInitializedRef.current = true;
        return;
      }

      // Check for new orders
      const newOrders = rawOrders.filter(o => o.Id && !knownOrderIdsRef.current.has(Number(o.Id)));

      if (newOrders.length > 0) {
        const newNotifs: OrderNotificationItem[] = [];

        newOrders.forEach(order => {
          const orderId = Number(order.Id);
          knownOrderIdsRef.current.add(orderId);

          const customerName = order.CustomerName || "Guest Customer";
          const entryNo = order.EntryNo || `#${orderId}`;
          const itemsCount = Array.isArray(order.Items) ? order.Items.length : 0;

          const notifItem: OrderNotificationItem = {
            id: `order_${orderId}_${Date.now()}`,
            orderId,
            entryNo,
            customerName,
            contactMobile: order.ContactMobile || "",
            totalTax: order.TotalTax || 0,
            itemCount: itemsCount,
            entryDate: order.EntryDate || new Date().toISOString(),
            timestamp: new Date(),
            read: false
          };

          newNotifs.push(notifItem);

          // 1. Toast Notification
          toast.success(
            <div>
              <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "4px" }}>
                🛍️ New E-Commerce Order Received!
              </div>
              <div style={{ fontSize: "13px", color: "#333" }}>
                Order <strong>{entryNo}</strong> by <strong>{customerName}</strong> ({itemsCount} item{itemsCount !== 1 ? "s" : ""})
              </div>
              <div style={{ fontSize: "12px", color: "#007bff", marginTop: "4px", textDecoration: "underline", cursor: "pointer" }}
                onClick={() => {
                  window.location.href = `${process.env.PUBLIC_URL || ""}/ecommerce/orders`;
                }}
              >
                Click here to view Order Details →
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true
            }
          );

          // 2. Browser Desktop OS Notification
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("New E-Commerce Order Received!", {
                body: `Order ${entryNo} by ${customerName} (${itemsCount} items)`,
                icon: "/favicon.ico"
              });
            } catch (e) {
              console.error("Desktop notification error:", e);
            }
          }
        });

        // 3. Audio Chime Sound
        playChimeSound();

        // 4. Update Notifications state & badge
        setNotifications(prev => [...newNotifs, ...prev]);
        setUnreadCount(prev => prev + newNotifs.length);

        // 5. Dispatch Custom Window Event so Orders.tsx can auto-refresh table
        window.dispatchEvent(new CustomEvent("eccom_new_order_received", { detail: newOrders }));
      }
    } catch (error) {
      console.error("Error in background order notification check:", error);
    }
  };

  // Background Polling Effect (runs every 10 seconds)
  useEffect(() => {
    // Initial fetch to populate baseline
    fetchOrdersCheck();

    const intervalId = setInterval(() => {
      fetchOrdersCheck();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id && !n.read) {
          setUnreadCount(c => Math.max(0, c - 1));
          return { ...n, read: true };
        }
        return n;
      })
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <OrderNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        clearNotifications,
        playNotificationSound: playChimeSound,
        fetchOrdersCheck
      }}
    >
      {children}
    </OrderNotificationContext.Provider>
  );
};

export const useOrderNotifications = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error("useOrderNotifications must be used within an OrderNotificationProvider");
  }
  return context;
};
