import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all users with their face images
    const users = await prisma.user.findMany({
      include: {
        faceImages: {
          select: {
            id: true,
            imagePath: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Return the users with their face images
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
