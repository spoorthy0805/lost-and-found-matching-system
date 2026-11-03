import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import pool from "./db";

export async function currentUser() {
  const token = (await cookies()).get("session")?.value;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id < 1 || Number(payload.userId) !== id) return null;
    const result = await pool.query("SELECT user_id, name, role FROM users WHERE user_id = $1", [id]);
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

export function safeMutation(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function errorResponse(error) {
  console.error("Feature API error:", error);
  return Response.json({ error: "Database operation failed" }, { status: 500 });
}
