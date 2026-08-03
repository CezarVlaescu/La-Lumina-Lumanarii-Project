import { NextResponse } from "next/server";
import { getAdminUser } from "../../../lib/admin-auth";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { isSameOriginMutation } from "../../../lib/request-security";
import {
  isSupabaseConfigured,
  uploadSupabaseMedia,
} from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 12 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
]);

function safeFilename(value: string) {
  const dot = value.lastIndexOf(".");
  const basename = (dot >= 0 ? value.slice(0, dot) : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return basename || "imagine";
}

async function matchesImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.type === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  const text = new TextDecoder("latin1").decode(bytes);
  if (file.type === "image/webp") {
    return text.startsWith("RIFF") && text.slice(8, 12) === "WEBP";
  }
  if (file.type === "image/avif") {
    return text.slice(4, 8) === "ftyp" && /avif|avis/.test(text.slice(8));
  }
  return false;
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Alege o imagine." }, { status: 400 });
  }
  const extension = IMAGE_EXTENSIONS.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: "Sunt acceptate numai imagini JPG, PNG, WebP sau AVIF." },
      { status: 415 },
    );
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "Imaginea poate avea maximum 12 MB." },
      { status: 413 },
    );
  }
  if (!(await matchesImageSignature(file))) {
    return NextResponse.json(
      { error: "Conținutul fișierului nu corespunde tipului de imagine." },
      { status: 415 },
    );
  }

  const key = `catalog/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFilename(file.name)}${extension}`;
  if (isSupabaseConfigured()) {
    const url = await uploadSupabaseMedia(
      key,
      await file.arrayBuffer(),
      file.type,
    );
    return NextResponse.json({
      image: {
        key,
        name: file.name,
        url,
      },
    });
  }

  const bucket = getRuntimeEnv().BUCKET;
  if (!bucket) {
    return NextResponse.json(
      { error: "Spațiul pentru imagini nu este configurat încă." },
      { status: 503 },
    );
  }

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      uploadedBy: user.email,
      originalName: file.name,
    },
  });

  return NextResponse.json({
    image: {
      key,
      name: file.name,
      url: `/media/${key}`,
    },
  });
}
