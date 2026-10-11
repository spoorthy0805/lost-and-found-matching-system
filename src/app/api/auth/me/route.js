
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token || !process.env.JWT_SECRET) {
    return Response.json(
      { success: false, message: "Not logged in." },
      { status: 401 }
    );
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
      throw new Error("Invalid session");
    }

    return Response.json({
      success: true,
      loggedIn: true,
    });
  } catch {
    return Response.json(
      { success: false, message: "Invalid or expired session." },
      { status: 401 }
    );
  }
}
