export type StoreRuntimeEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  ADMIN_EMAILS?: string;
  ADMIN_SESSION_SECRET?: string;
  ACCOUNT_SESSION_SECRET?: string;
  EMAIL_PROVIDER?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  RESEND_API_KEY?: string;
  STORE_EMAIL_FROM?: string;
  STORE_MARKETING_EMAIL_FROM?: string;
  STORE_NOTIFICATION_EMAIL?: string;
  RESEND_MARKETING_SEGMENT_ID?: string;
  NEWSLETTER_SIGNING_SECRET?: string;
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
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    STORE_EMAIL_FROM: process.env.STORE_EMAIL_FROM,
    STORE_MARKETING_EMAIL_FROM: process.env.STORE_MARKETING_EMAIL_FROM,
    STORE_NOTIFICATION_EMAIL: process.env.STORE_NOTIFICATION_EMAIL,
    RESEND_MARKETING_SEGMENT_ID: process.env.RESEND_MARKETING_SEGMENT_ID,
    NEWSLETTER_SIGNING_SECRET: process.env.NEWSLETTER_SIGNING_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ...runtimeEnv,
  };
}
