import pool from "../../../../lib/db";
import { currentUser, safeMutation, errorResponse } from "../../../../lib/feature-auth";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Login required" }, { status: 401 });
    if (user.role !== "ADMIN") return Response.json({ error: "Admin access only" }, { status: 403 });
    const result = await pool.query(`SELECT c.claim_id, c.match_id, c.claimer_id, c.message, c.status,
      c.claim_date, c.reviewed_by, l.title AS lost_title, f.title AS found_title,
      m.similarity_score FROM claims c JOIN matches m ON m.match_id=c.match_id
      JOIN items l ON l.item_id=m.lost_item_id JOIN items f ON f.item_id=m.found_item_id
      ORDER BY CASE WHEN c.status='PENDING' THEN 0 ELSE 1 END, c.claim_date DESC LIMIT 150`);
    return Response.json({ claims: result.rows });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request) {
  if (!safeMutation(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  let client;
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Login required" }, { status: 401 });
    if (user.role !== "ADMIN") return Response.json({ error: "Admin access only" }, { status: 403 });
    const body = await request.json().catch(() => null);
    const claimId = Number(body?.claimId);
    const decision = body?.decision;
    if (!Number.isSafeInteger(claimId) || claimId < 1 || !["APPROVED", "REJECTED"].includes(decision)) {
      return Response.json({ error: "Invalid claim or decision" }, { status: 400 });
    }
    client = await pool.connect();
    await client.query("BEGIN");
    const claim = await client.query("SELECT claim_id, match_id, claimer_id, status FROM claims WHERE claim_id=$1 FOR UPDATE", [claimId]);
    if (!claim.rowCount) { await client.query("ROLLBACK"); return Response.json({ error: "Claim not found" }, { status: 404 }); }
    const record = claim.rows[0];
    if (record.status !== "PENDING") { await client.query("ROLLBACK"); return Response.json({ error: "Claim already reviewed" }, { status: 409 }); }
    const match = await client.query("SELECT match_id, status FROM matches WHERE match_id=$1 FOR UPDATE", [record.match_id]);
    if (!match.rowCount || match.rows[0].status !== "PENDING") { await client.query("ROLLBACK"); return Response.json({ error: "Match already reviewed" }, { status: 409 }); }
    await client.query("UPDATE claims SET status=$1, reviewed_by=$2, decision_date=NOW() WHERE claim_id=$3", [decision, user.user_id, claimId]);
    if (decision === "APPROVED") {
      await client.query("UPDATE matches SET status='REVIEWED' WHERE match_id=$1", [record.match_id]);
      const others = await client.query("UPDATE claims SET status='REJECTED', reviewed_by=$1, decision_date=NOW() WHERE match_id=$2 AND claim_id<>$3 AND status='PENDING' RETURNING claimer_id, claim_id", [user.user_id, record.match_id, claimId]);
      for (const other of others.rows) await client.query("INSERT INTO notifications(user_id,message) VALUES ($1,$2)", [other.claimer_id, `Claim #${other.claim_id} was rejected because another claim was approved.`]);
    }
    await client.query("INSERT INTO notifications(user_id,message) VALUES ($1,$2)", [record.claimer_id, `Claim #${claimId} for match #${record.match_id} was ${decision.toLowerCase()}.`]);
    await client.query("COMMIT");
    return Response.json({ success: true, claimId, status: decision });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return errorResponse(error);
  } finally { if (client) client.release(); }
}
