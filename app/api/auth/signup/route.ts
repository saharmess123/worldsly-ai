import {
  apiError,
  badRequest,
  conflict,
} from "../../../lib/api-response";
import { hashPassword } from "../../../lib/auth";
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
      name,
      email,
      password,
    } = body as {
      name?: unknown;
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

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: emailTrimmed,
        },
      });

    if (existingUser) {
      return conflict(
        "Email is already registered."
      );
    }

    const userCount =
      await prisma.user.count();

    const role =
      userCount === 0
        ? "admin"
        : "user";

    const passwordHash =
      hashPassword(password);

    const user =
      await prisma.user.create({
        data: {
          name:
            typeof name === "string" &&
            name.trim()
              ? name.trim()
              : null,
          email: emailTrimmed,
          passwordHash,
          role,
          settings: {
            create: {},
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

    return Response.json(
      {
        success: true,
        message:
          `User created successfully as ${role}.`,
        user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Signup error:",
      error
    );

    return apiError(
      "Failed to sign up.",
      {
        status: 500,
        code: "SIGNUP_FAILED",
      }
    );
  }
}