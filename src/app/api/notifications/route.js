
import pool from "../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function getUserId() {
  const token = (await cookies()).get("session")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
      { algorithms: ["HS256"] }
    );

    const userId = Number(payload.sub);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      Number(payload.userId) !== userId
    ) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return Response.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `SELECT notification_id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC, notification_id DESC`,
      [userId]
    );

    return Response.json({
      success: true,
      notifications: result.rows,
      unreadCount: result.rows.filter((n) => !n.is_read).length,
    });
  } catch (error) {
    console.error("Notifications error:", error.message);

    return Response.json(
      { success: false, message: "Could not load notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return Response.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return Response.json(
        { success: false, message: "Invalid request." },
        { status: 400 }
      );
    }

    if (body.markAll === true) {
      await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
    } else {
      const notificationId = Number(body.notificationId);

      if (
        !Number.isSafeInteger(notificationId) ||
        notificationId <= 0
      ) {
        return Response.json(
          { success: false, message: "Invalid notification ID." },
          { status: 400 }
        );
      }

      const result = await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE notification_id = $1 AND user_id = $2
         RETURNING notification_id`,
        [notificationId, userId]
      );

      if (result.rowCount === 0) {
        return Response.json(
          { success: false, message: "Notification not found." },
          { status: 404 }
        );
      }
    }

    return Response.json({
      success: true,
      message: "Notifications updated successfully.",
    });
  } catch (error) {
    console.error("Notification update error:", error.message);

    return Response.json(
      { success: false, message: "Could not update notifications." },
      { status: 500 }
    );
  }
}
