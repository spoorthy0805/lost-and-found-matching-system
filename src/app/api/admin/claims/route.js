
import pool from "../../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  try {
    const token = (await cookies()).get("session")?.value;

    if (!token || !process.env.JWT_SECRET) {
      return Response.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    let userId;

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET),
        { algorithms: ["HS256"] }
      );

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
        { success: false, message: "Invalid session." },
        { status: 401 }
      );
    }

    const admin = await pool.query(
      "SELECT role FROM users WHERE user_id = $1",
      [userId]
    );

    if (admin.rows[0]?.role !== "ADMIN") {
      return Response.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `SELECT
         c.claim_id,
         c.match_id,
         c.claimer_id,
         c.message,
         c.status,
         c.claim_date,
         c.reviewed_by,
         c.decision_date,
         u.name AS claimer_name,
         u.email AS claimer_email,
         l.title AS lost_title,
         f.title AS found_title,
         m.similarity_score
       FROM claims c
       JOIN users u ON u.user_id = c.claimer_id
       JOIN matches m ON m.match_id = c.match_id
       JOIN items l ON l.item_id = m.lost_item_id
       JOIN items f ON f.item_id = m.found_item_id
       ORDER BY
         CASE WHEN c.status = 'PENDING' THEN 0 ELSE 1 END,
         c.claim_date DESC`
    );

    return Response.json({
      success: true,
      claims: result.rows,
    });
  } catch (error) {
    console.error("Admin claims error:", error.message);

    return Response.json(
      { success: false, message: "Could not load claims." },
      { status: 500 }
    );
  }
}
