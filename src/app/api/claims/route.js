
import pool from "../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function POST(request) {
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
        { success: false, message: "Session expired. Log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const matchId = Number(body.match_id);
    const message = body.message;

    if (
      !Number.isSafeInteger(matchId) ||
      matchId <= 0 ||
      typeof message !== "string" ||
      !message.trim() ||
      message.trim().length > 1000
    ) {
      return Response.json(
        { success: false, message: "Enter a valid match and claim message." },
        { status: 400 }
      );
    }

    const match = await pool.query(
      `SELECT m.match_id
       FROM matches m
       JOIN items l ON l.item_id = m.lost_item_id
       JOIN items f ON f.item_id = m.found_item_id
       WHERE m.match_id = $1
         AND m.status = 'PENDING'
         AND l.user_id = $2
         AND f.user_id <> $2
         AND l.status IN ('OPEN', 'MATCHED')
         AND f.status IN ('OPEN', 'MATCHED')`,
      [matchId, userId]
    );

    if (match.rowCount === 0) {
      return Response.json(
        {
          success: false,
          message: "This match is not eligible for your claim.",
        },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `INSERT INTO claims (match_id, claimer_id, message)
       VALUES ($1, $2, $3)
       ON CONFLICT (match_id, claimer_id) DO NOTHING
       RETURNING claim_id, match_id, status`,
      [matchId, userId, message.trim()]
    );

    if (result.rowCount === 0) {
      return Response.json(
        {
          success: false,
          message: "You have already submitted a claim for this match.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Claim submitted successfully!",
        claim: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Claim submission error:", error.message);

    return Response.json(
      { success: false, message: "Failed to submit claim." },
      { status: 500 }
    );
  }
}
