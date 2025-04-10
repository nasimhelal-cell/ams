import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// Add this line to mark the route as dynamic
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const image = formData.get("image") as File;
    const userId = formData.get("userId") as string;

    if (!image || !userId) {
      return NextResponse.json(
        { error: "Image or userId not provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const filename = image.name;

    // Create directory path
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "faces",
      userId
    );
    await mkdir(uploadDir, { recursive: true });

    // Save the file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, new Uint8Array(buffer));

    // Return the relative path for database storage
    const relativePath = `/uploads/faces/${userId}/${filename}`;

    return NextResponse.json({
      success: true,
      filePath: relativePath,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
