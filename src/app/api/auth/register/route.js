
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, email, password, phone } = data;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return Response.json(
        { success: false, message: "Enter valid details and a password of at least 8 characters." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";

    if (
      cleanName.length > 100 ||
      cleanEmail.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      password.length > 72 ||
      cleanPhone.length > 15
    ) {
      return Response.json(
        { success: false, message: "Please check your registration details." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'USER')
       RETURNING user_id, name, email, role`,
      [cleanName, cleanEmail, passwordHash, cleanPhone || null]
    );

    return Response.json(
      {
        success: true,
        message: "Registration successful!",
        user: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "23505") {
      return Response.json(
        { success: false, message: "This email is already registered." },
        { status: 409 }
      );
    }

    console.error("Registration failed:", error.message);

    return Response.json(
      { success: false, message: "Registration failed." },
      { status: 500 }
    );
  }
}
