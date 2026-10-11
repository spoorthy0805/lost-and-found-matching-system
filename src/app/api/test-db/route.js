
import pool from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    return Response.json({
      success: true,
      database: "lost_found_db",
      tables: result.rows.map((row) => row.table_name),
    });
  } catch (error) {
    console.error(error.message);

    return Response.json(
      { success: false, message: "Database query failed" },
      { status: 500 }
    );
  }
}
