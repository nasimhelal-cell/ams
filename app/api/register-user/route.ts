import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    // Validate required fields
    if (
      !userData.id ||
      !userData.email ||
      !userData.password ||
      !userData.name
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user with face images in a single transaction
    const user = await prisma.user.create({
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        designation: userData.designation,
        faceImages: {
          create: userData.faceImagePaths.map((path: string) => ({
            imagePath: path,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error: any) {
    console.error("Error registering user:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email address already registered" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
