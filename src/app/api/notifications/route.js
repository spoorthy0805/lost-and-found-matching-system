import pool from "../../../lib/db";
import { currentUser, safeMutation, errorResponse } from "../../../lib/feature-auth";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Login required" }, { status: 401 });
    const result = await pool.query("SELECT notification_id, message, is_read, created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC, notification_id DESC LIMIT 100", [user.user_id]);
    return Response.json({ notifications: result.rows, unread: result.rows.filter(x => !x.is_read).length });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request) {
  if (!safeMutation(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Login required" }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return Response.json({ error: "Invalid request" }, { status: 400 });
    if (body.all === true) {
      const result = await pool.query("UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND is_read=FALSE", [user.user_id]);
      return Response.json({ updated: result.rowCount });
    }
    const id = Number(body.notificationId);
    if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: "Invalid notification ID" }, { status: 400 });
    const result = await pool.query("UPDATE notifications SET is_read=TRUE WHERE notification_id=$1 AND user_id=$2 RETURNING notification_id", [id, user.user_id]);
    if (!result.rowCount) return Response.json({ error: "Notification not found" }, { status: 404 });
    return Response.json({ updated: 1 });
  } catch (error) { return errorResponse(error); }
}
