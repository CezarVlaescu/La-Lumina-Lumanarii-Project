import { getRuntimeEnv } from "../../lib/runtime-env";
import {
  downloadSupabaseMedia,
  isSupabaseConfigured,
} from "../../lib/supabase-server";

type MediaRouteProps = {
  params: Promise<{ key: string[] }>;
};

export async function GET(_request: Request, { params }: MediaRouteProps) {
  const { key } = await params;
  const objectKey = key.join("/");
  if (isSupabaseConfigured()) {
    const object = await downloadSupabaseMedia(objectKey);
    if (!object) {
      return new Response("Imaginea nu a fost găsită.", { status: 404 });
    }
    return new Response(object.bytes, {
      headers: {
        "content-type": object.contentType,
        etag: object.etag,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  const bucket = getRuntimeEnv().BUCKET;
  if (!bucket) return new Response("Spațiul media nu este disponibil.", { status: 503 });

  const object = await bucket.get(objectKey);
  if (!object) return new Response("Imaginea nu a fost găsită.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
