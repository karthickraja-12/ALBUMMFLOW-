import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, contentType, eventId } = await request.json();

    if (!filename || !contentType || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create a unique, sanitized path in S3
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `events/${eventId}/${uuidv4()}-${sanitizedName}`;

    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (error) {
    console.error("Presigned URL Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
