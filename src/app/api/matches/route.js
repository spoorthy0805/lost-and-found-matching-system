
import pool from "../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

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
        { success: false, message: "Session expired." },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `SELECT
         m.match_id,
         m.similarity_score,
         m.status,
         l.title AS lost_title,
         l.description AS lost_description,
         l.location AS lost_location,
         f.title AS found_title,
         f.description AS found_description,
         f.location AS found_location,
         (l.user_id = $1 AND f.user_id <> $1) AS can_claim,
         c.status AS my_claim_status
       FROM matches m
       JOIN items l ON m.lost_item_id = l.item_id
       JOIN items f ON m.found_item_id = f.item_id
       LEFT JOIN claims c
         ON c.match_id = m.match_id
         AND c.claimer_id = $1
       WHERE (l.user_id = $1 OR f.user_id = $1)
         AND l.status IN ('OPEN', 'MATCHED')
         AND f.status IN ('OPEN', 'MATCHED')
       ORDER BY m.similarity_score DESC`,
      [userId]
    );

    return Response.json({
      success: true,
      matches: result.rows,
    });
  } catch (error) {
    console.error("Matches API error:", error.message);

    return Response.json(
      { success: false, message: "Failed to load matches." },
      { status: 500 }
    );
  }
}
