
import pool from "../../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  const token = (await cookies()).get("session")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return Response.json(
      { success: false, message: "Not logged in." },
      { status: 401 }
    );
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
      return Response.json(
        { success: false, message: "Invalid session." },
        { status: 401 }
      );
    }

    const result = await pool.query(
      "SELECT user_id, name, role FROM users WHERE user_id = $1",
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return Response.json(
        { success: false, message: "User not found." },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      loggedIn: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error.message);

    return Response.json(
      { success: false, message: "Invalid session or server error." },
      { status: 401 }
    );
  }
}
