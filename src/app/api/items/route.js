
import pool from "../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";

function runMatching() {
  return new Promise((resolve, reject) => {
    const python =
      process.env.PYTHON_PATH ||
      (process.platform === "win32"
        ? path.join(process.cwd(), ".venv", "Scripts", "python.exe")
        : path.join(process.cwd(), ".venv", "bin", "python"));

    const script = path.join(process.cwd(), "scripts", "smart_match.py");

    const child = spawn(
      /* turbopackIgnore: true */
      python,
      [script],
      {
        cwd: process.cwd(),
        windowsHide: true,
      }
    );

    let output = "";
    let errors = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      errors += data.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errors || `Matching exited with code ${code}`));
      }
    });
  });
}

export async function POST(request) {
  try {
    const token = (await cookies()).get("session")?.value;

    if (!token) {
      return Response.json(
        { success: false, message: "Please log in to report an item." },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      return Response.json(
        { success: false, message: "Server configuration error." },
        { status: 500 }
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
        { success: false, message: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const data = await request.json();

    const { title, description, category, location, date, item_type } = data;

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof location !== "string" ||
      typeof date !== "string" ||
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !date.trim()
    ) {
      return Response.json(
        { success: false, message: "Please fill all fields." },
        { status: 400 }
      );
    }

    if (!["LOST", "FOUND"].includes(item_type)) {
      return Response.json(
        { success: false, message: "Invalid item type." },
        { status: 400 }
      );
    }

    const categoryId = Number(category);

    if (
      !Number.isSafeInteger(categoryId) ||
      categoryId <= 0 ||
      title.trim().length > 150 ||
      location.trim().length > 200 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    ) {
      return Response.json(
        { success: false, message: "Please enter valid item details." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO items
       (user_id, category_id, item_type, title, description, location, date_found_lost)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING item_id, user_id, title, item_type`,
      [
        userId,
        categoryId,
        item_type,
        title.trim(),
        description.trim(),
        location.trim(),
        date,
      ]
    );

    let matchingCompleted = false;

    try {
      const output = await runMatching();
      console.log("Automatic AI matching:", output);
      matchingCompleted = true;
    } catch (error) {
      console.error("Automatic AI matching failed:", error.message);
    }

    return Response.json(
      {
        success: true,
        message: matchingCompleted
          ? "Item reported successfully! AI matching completed."
          : "Item reported successfully! AI matching could not complete.",
        item: result.rows[0],
        matchingCompleted,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Item submission failed:", error.message);

    return Response.json(
      { success: false, message: "Failed to save item." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT
        i.item_id,
        i.title,
        i.description,
        i.item_type,
        i.location,
        i.date_found_lost,
        i.status,
        c.category_name
       FROM items i
       JOIN categories c ON i.category_id = c.category_id
       WHERE i.status IN ('OPEN', 'MATCHED')
       ORDER BY i.created_at DESC, i.item_id DESC`
    );

    return Response.json({
      success: true,
      items: result.rows,
    });
  } catch (error) {
    console.error(error.message);

    return Response.json(
      { success: false, message: "Failed to load items" },
      { status: 500 }
    );
  }
}
