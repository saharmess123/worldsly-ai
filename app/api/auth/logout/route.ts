import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  // Clear HTTP-Only Session Cookie
  response.cookies.set("wordsly_session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  // Clear Legacy Role Cookie
  response.cookies.set("wordsly_user_role", "", {
    expires: new Date(0),
    path: "/",
  });

  return response;
}
