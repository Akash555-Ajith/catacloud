import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "digital-catalogue";
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

export async function POST(req: NextRequest) {
  try {
    if (!accountId || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { error: "Cloudflare R2 credentials (CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY) are not set in environment variables." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const fileExtension = file.name.split(".").pop();
    const key = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // If public URL doesn't end with slash, add it, or build fallback path
    const fileUrl = publicUrl 
      ? `${publicUrl.replace(/\/$/, "")}/${key}`
      : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error("R2 Upload Error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
