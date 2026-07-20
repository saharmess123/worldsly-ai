import { NextResponse } from "next/server";

import {
  apiError,
  badRequest,
  unauthorized,
} from "../../../lib/api-response";
import {
  hashPassword,
  signToken,
  verifyPassword,
} from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return badRequest("Invalid request body.");
    }

    const {
      email,
      password,
    } = body as {
      email?: unknown;
      password?: unknown;
    };

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return badRequest(
        "Email and password are required."
      );
    }

    const emailTrimmed =
      email.trim().toLowerCase();

    const userCount =
      await prisma.user.count();

    if (userCount === 0) {
      const seededHash =
        hashPassword("adminadmin");

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

    const user =
      await prisma.user.findUnique({
        where: {
          email: emailTrimmed,
        },
      });

    if (
      !user ||
      !user.passwordHash
    ) {
      return unauthorized(
        "Invalid email or password."
      );
    }

    const isPasswordValid =
      verifyPassword(
        password,
        user.passwordHash
      );

    if (!isPasswordValid) {
      return unauthorized(
        "Invalid email or password."
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response =
      NextResponse.json({
        success: true,
        message:
          "Logged in successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });

    response.cookies.set(
      "wordsly_session",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    response.cookies.set(
      "wordsly_user_role",
      user.role,
      {
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return apiError(
      "Failed to log in.",
      {
        status: 500,
        code: "LOGIN_FAILED",
      }
    );
  }
}