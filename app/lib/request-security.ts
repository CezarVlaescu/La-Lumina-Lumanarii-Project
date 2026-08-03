import { getRuntimeEnv } from "./runtime-env";
import {
  isSupabaseConfigured,
  supabaseRpc,
} from "./supabase-server";

export function isSameOriginMutation(request: Request) {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return true;

  try {
    const origin = new URL(originHeader).origin;
    const allowedOrigins = new Set<string>();

    for (const candidate of [
      request.url,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.URL,
    ]) {
      if (!candidate) continue;

      try {
        allowedOrigins.add(new URL(candidate).origin);
      } catch {
        // Ignoră valorile URL invalide.
      }
    }

    return allowedOrigins.has(origin);
  } catch {
    return false;
  }
}

export function isJsonRequestWithinLimit(
  request: Request,
  maxBytes: number,
) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { ok: false as const, status: 415, error: "Formatul nu este acceptat." };
  }
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxBytes) {
    return { ok: false as const, status: 413, error: "Cererea este prea mare." };
  }
  return { ok: true as const };
}

async function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 160) ?? "";
  const bytes = new TextEncoder().encode(`${forwarded}|${userAgent}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function consumeRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
  ) {
  try {
    const now = Date.now();
    const resetThreshold = now - windowMs;
    const key = `${scope}:${await requestFingerprint(request)}`;
    const updatedAt = new Date(now).toISOString();
    if (isSupabaseConfigured()) {
      const row = await supabaseRpc<{
        count: number;
        window_start: number;
      }>("store_consume_rate_limit", {
        rate_key: key,
        current_time: now,
        reset_threshold: resetThreshold,
        updated_at_value: updatedAt,
      });
      if (!row || row.count <= limit) {
        return { allowed: true, retryAfterSeconds: 0 };
      }
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((row.window_start + windowMs - now) / 1000),
        ),
      };
    }

    const database = getRuntimeEnv().DB;
    if (!database) return { allowed: true, retryAfterSeconds: 0 };
    const row = await database
      .prepare(
        `INSERT INTO request_rate_limits
          ("key", "count", "window_start", "updated_at")
         VALUES (?, 1, ?, ?)
         ON CONFLICT("key") DO UPDATE SET
          "count" = CASE
            WHEN "window_start" <= ? THEN 1
            ELSE "count" + 1
          END,
          "window_start" = CASE
            WHEN "window_start" <= ? THEN excluded."window_start"
            ELSE "window_start"
          END,
          "updated_at" = excluded."updated_at"
         RETURNING "count", "window_start"`,
      )
      .bind(key, now, updatedAt, resetThreshold, resetThreshold)
      .first<{ count: number; window_start: number }>();

    if (!row || row.count <= limit) {
      return { allowed: true, retryAfterSeconds: 0 };
    }
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((row.window_start + windowMs - now) / 1000),
      ),
    };
  } catch {
    // A temporary limiter failure must not lose a legitimate order.
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
