import { useState, useCallback, useMemo } from "react";
import { NotificationItem } from "../types";
import { NotificationsService } from "../services/supabase";

export function useNotifications(initialNotifications: NotificationItem[] = []) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const addNotification = useCallback(async (n: Omit<NotificationItem, "id" | "timestamp" | "read">) => {
    const newNotif: NotificationItem = {
      ...n,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    await NotificationsService.saveNotification(newNotif).catch((err) => {
      console.warn("[useNotifications] Failed to persist notification:", err);
    });
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    const target = notifications.find((n) => n.id === id);
    if (target) {
      await NotificationsService.saveNotification({ ...target, read: true }).catch(() => {});
    }
  }, [notifications]);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    for (const notif of notifications) {
      if (!notif.read) {
        await NotificationsService.saveNotification({ ...notif, read: true }).catch(() => {});
      }
    }
  }, [notifications]);

  return {
    notifications,
    setNotifications,
    unreadCount,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
