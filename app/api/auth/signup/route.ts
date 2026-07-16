import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { hashPassword } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email is already registered." },
        { status: 400 }
      );
    }

    // Determine role (the first user registered becomes Admin automatically)
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "admin" : "user";

    const passwordHash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name ? name.trim() : null,
        email: emailTrimmed,
        passwordHash,
        role,
        settings: {
          create: {}, // Create default settings
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User created successfully as ${role}.`,
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to sign up: " + message },
      { status: 500 }
    );
  }
}
