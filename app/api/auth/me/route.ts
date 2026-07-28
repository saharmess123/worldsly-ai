import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  apiError,
  apiSuccess,
  unauthorized,
} from "../../../lib/api-response";
import { verifyToken } from "../../../lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie =
      cookieStore.get("wordsly_session");

    if (
      !tokenCookie ||
      !tokenCookie.value
    ) {
      return unauthorized(
        "Not authenticated.",
        {
          authenticated: false,
        }
      );
    }

    const decoded =
      verifyToken(tokenCookie.value);

    if (!decoded) {
      return unauthorized(
        "Invalid session.",
        {
          authenticated: false,
        }
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
    console.error(
      "Auth me error:",
      error
    );

    return apiError(
      "Server error.",
      {
        status: 500,
        code: "AUTH_ME_FAILED",
        extra: {
          authenticated: false,
        },
      }
    );
  }
}