export type StoreRuntimeEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  ADMIN_EMAILS?: string;
  ADMIN_SESSION_SECRET?: string;
  ACCOUNT_SESSION_SECRET?: string;
  RESEND_API_KEY?: string;
  STORE_EMAIL_FROM?: string;
  STORE_NOTIFICATION_EMAIL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

let runtimeEnv: StoreRuntimeEnv | null = null;

export function registerRuntimeEnv(env: StoreRuntimeEnv) {
  runtimeEnv = env;
}

export function getRuntimeEnv(): StoreRuntimeEnv {
  return {
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ACCOUNT_SESSION_SECRET: process.env.ACCOUNT_SESSION_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    STORE_EMAIL_FROM: process.env.STORE_EMAIL_FROM,
    STORE_NOTIFICATION_EMAIL: process.env.STORE_NOTIFICATION_EMAIL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ...runtimeEnv,
  };
}
