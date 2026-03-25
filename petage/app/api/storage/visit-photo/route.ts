import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { adminStorage } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { MAX_PHOTO_SIZE, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { logger } from "@/lib/logger";

// Max 10 MB for visit photos (larger than pet photos to accommodate receipts/records)
const MAX_VISIT_PHOTO_SIZE = Math.max(MAX_PHOTO_SIZE, 10 * 1024 * 1024);

export async function POST(request: Request) {
  try {
    const uid = await verifyIdToken(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const petId = formData.get("petId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File must be an image (JPEG, PNG, WebP, GIF, or HEIC)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_VISIT_PHOTO_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 10 MB" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const folder = petId ? `visits/${uid}/${petId}` : `visits/${uid}`;
    const path = `${folder}/${Date.now()}_${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(path);

    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    });

    const url =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(path)}?alt=media&token=${token}`;

    logger.info("visit-photo.upload.success", { uid, petId: petId ?? "unknown" });
    return NextResponse.json({ url });
  } catch (err) {
    logger.error("visit-photo.upload.error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
