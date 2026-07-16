import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("wordsly_session");

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(tokenCookie.value);

    if (!decoded) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Invalid session." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { success: false, authenticated: false, error: "Server error." },
      { status: 500 }
    );
  }
}
