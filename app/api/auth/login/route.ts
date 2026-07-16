import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyPassword, signToken, hashPassword } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Auto-seed admin user if user count is 0
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const seededHash = hashPassword("adminadmin");
      await prisma.user.create({
        data: {
          name: "Admin User",
          email: "admin@wordsly.ai",
          passwordHash: seededHash,
          role: "admin",
          settings: {
            create: {},
          },
        },
      });
    }

    // Query user
    const user = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create session token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set("wordsly_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Legacy cookie compatibility for frontend navigation if needed
    response.cookies.set("wordsly_user_role", user.role, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to log in: " + message },
      { status: 500 }
    );
  }
}
