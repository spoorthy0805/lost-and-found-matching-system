
import pool from "../../../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function PATCH(request, { params }) {
  let client;

  try {
    const token = (await cookies()).get("session")?.value;

    if (!token || !process.env.JWT_SECRET) {
      return Response.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    let adminId;

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET),
        { algorithms: ["HS256"] }
      );

      adminId = Number(payload.sub);

      if (
        !Number.isSafeInteger(adminId) ||
        adminId <= 0 ||
        Number(payload.userId) !== adminId
      ) {
        throw new Error("Invalid session");
      }
    } catch {
      return Response.json(
        { success: false, message: "Invalid session." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const claimId = Number(id);
    const { decision } = await request.json();

    if (
      !Number.isSafeInteger(claimId) ||
      claimId <= 0 ||
      !["APPROVED", "REJECTED"].includes(decision)
    ) {
      return Response.json(
        { success: false, message: "Invalid claim or decision." },
        { status: 400 }
      );
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const admin = await client.query(
      "SELECT role FROM users WHERE user_id = $1",
      [adminId]
    );

    if (admin.rows[0]?.role !== "ADMIN") {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const claimResult = await client.query(
      `SELECT c.claim_id, c.match_id, c.claimer_id,
              c.status, m.status AS match_status
       FROM claims c
       JOIN matches m ON m.match_id = c.match_id
       WHERE c.claim_id = $1
       FOR UPDATE OF c, m`,
      [claimId]
    );

    if (claimResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Claim not found." },
        { status: 404 }
      );
    }

    const claim = claimResult.rows[0];

    if (claim.status !== "PENDING" || claim.match_status !== "PENDING") {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Claim is no longer pending." },
        { status: 409 }
      );
    }

    const updated = await client.query(
      `UPDATE claims
       SET status = $1,
           reviewed_by = $2,
           decision_date = NOW()
       WHERE claim_id = $3
       RETURNING claim_id, match_id, claimer_id, status`,
      [decision, adminId, claimId]
    );

    if (decision === "APPROVED") {
      await client.query(
        `UPDATE matches
         SET status = 'REVIEWED'
         WHERE match_id = $1`,
        [claim.match_id]
      );

      const others = await client.query(
        `UPDATE claims
         SET status = 'REJECTED',
             reviewed_by = $1,
             decision_date = NOW()
         WHERE match_id = $2
           AND claim_id <> $3
           AND status = 'PENDING'
         RETURNING claimer_id`,
        [adminId, claim.match_id, claimId]
      );

      for (const other of others.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, message)
           VALUES ($1, $2)`,
          [
            other.claimer_id,
            "Your claim was rejected because another claim for this match was approved.",
          ]
        );
      }
    }

    const message =
      decision === "APPROVED"
        ? `Your claim #${claimId} has been approved.`
        : `Your claim #${claimId} has been rejected.`;

    await client.query(
      `INSERT INTO notifications (user_id, message)
       VALUES ($1, $2)`,
      [claim.claimer_id, message]
    );

    await client.query("COMMIT");

    return Response.json({
      success: true,
      message: `Claim ${decision.toLowerCase()} successfully!`,
      claim: updated.rows[0],
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Admin decision error:", error.message);

    return Response.json(
      { success: false, message: "Could not review claim." },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
