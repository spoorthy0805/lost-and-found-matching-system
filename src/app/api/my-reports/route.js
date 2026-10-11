
import pool from "../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token || !process.env.JWT_SECRET) {
      return Response.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    let userId;

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);

      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      userId = Number(payload.sub);

      if (
        !Number.isSafeInteger(userId) ||
        userId <= 0 ||
        Number(payload.userId) !== userId
      ) {
        throw new Error("Invalid session");
      }
    } catch {
      return Response.json(
        { success: false, message: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `SELECT
        i.item_id,
        i.title,
        i.description,
        i.item_type,
        i.location,
        i.date_found_lost,
        i.status,
        i.category_id,
        c.category_name
       FROM items i
       JOIN categories c ON i.category_id = c.category_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC, i.item_id DESC`,
      [userId]
    );

    return Response.json({
      success: true,
      items: result.rows,
    });
  } catch (error) {
    console.error(error.message);

    return Response.json(
      { success: false, message: "Failed to load reports." },
      { status: 500 }
    );
  }
}
