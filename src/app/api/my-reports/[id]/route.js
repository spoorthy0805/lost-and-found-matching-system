
import pool from "../../../../lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    const userId = Number(payload.sub);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      Number(payload.userId) !== userId
    ) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export async function PATCH(request, { params }) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return Response.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const itemId = Number(id);

    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return Response.json(
        { success: false, message: "Invalid item ID." },
        { status: 400 }
      );
    }

    const { title, description, location, date_found_lost } =
      await request.json();

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof location !== "string" ||
      typeof date_found_lost !== "string" ||
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date_found_lost)
    ) {
      return Response.json(
        { success: false, message: "Please fill in all fields correctly." },
        { status: 400 }
      );
    }

    const date = new Date(`${date_found_lost}T00:00:00Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== date_found_lost
    ) {
      return Response.json(
        { success: false, message: "Invalid date." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE items
       SET title = $1,
           description = $2,
           location = $3,
           date_found_lost = $4
       WHERE item_id = $5
         AND user_id = $6
         AND status = 'OPEN'
       RETURNING item_id`,
      [
        title.trim(),
        description.trim(),
        location.trim(),
        date_found_lost,
        itemId,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return Response.json(
        { success: false, message: "Report not found or cannot be edited." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Report updated successfully!",
    });
  } catch (error) {
    console.error("Update report error:", error.message);

    return Response.json(
      { success: false, message: "Failed to update report." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return Response.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const itemId = Number(id);

    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return Response.json(
        { success: false, message: "Invalid item ID." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE items
       SET status = 'CLOSED'
       WHERE item_id = $1
         AND user_id = $2
         AND status = 'OPEN'
       RETURNING item_id`,
      [itemId, userId]
    );

    if (result.rowCount === 0) {
      return Response.json(
        { success: false, message: "Report not found or cannot be deleted." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Report removed from public listings.",
    });
  } catch (error) {
    console.error("Delete report error:", error.message);

    return Response.json(
      { success: false, message: "Failed to delete report." },
      { status: 500 }
    );
  }
}
