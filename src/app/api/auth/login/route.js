
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return Response.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT user_id, name, email, password_hash, role FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return Response.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return Response.json(
        { success: false, message: "Server configuration error." },
        { status: 500 }
      );
    }

    const token = await new SignJWT({
      userId: user.user_id,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.user_id))
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(secret));

    const response = Response.json({
      success: true,
      message: "Login successful!",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.headers.append(
      "Set-Cookie",
      `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return response;
  } catch (error) {
    console.error("Login error:", error.message);

    return Response.json(
      { success: false, message: "Login failed." },
      { status: 500 }
    );
  }
}


