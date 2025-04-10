// ... existing code ...

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop();
    console.log("userId", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // First delete all face images associated with the user
    await prisma.faceImage.deleteMany({
      where: {
        userId: userId,
      },
    });

    // Then delete the user
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
// ... existing code ...
