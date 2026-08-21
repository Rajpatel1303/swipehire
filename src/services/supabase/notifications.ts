import { supabase } from "./client";
import { NotificationItem } from "../../types";

export class NotificationsService {
  /**
   * Fetch all notifications
   */
  static async getNotifications(): Promise<NotificationItem[]> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((n) => ({
        id: n.id,
        recipientId: n.recipient_id,
        role: n.role as any,
        title: n.title,
        message: n.message,
        type: n.type as any,
        timestamp: n.created_at,
        read: !!n.is_read,
        linkAction: n.link_action || undefined,
      }));
    } catch (err) {
      console.warn("[NotificationsService] Error fetching notifications:", err);
      return [];
    }
  }

  /**
   * Save or update notification
   */
  static async saveNotification(n: NotificationItem): Promise<boolean> {
    try {
      const { error } = await supabase.from("notifications").upsert({
        id: n.id,
        recipient_id: n.recipientId,
        role: n.role,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.read,
        link_action: n.linkAction,
        created_at: n.timestamp || new Date().toISOString(),
      });

      return !error;
    } catch (err) {
      console.warn("[NotificationsService] Error saving notification:", err);
      return false;
    }
  }
}
