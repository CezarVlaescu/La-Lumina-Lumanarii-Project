import { absoluteSiteUrl, siteName } from "./site-config";

export type EmailAction = {
  label: string;
  href: string;
  secondary?: boolean;
};

export function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function actionButtons(actions: EmailAction[]) {
  if (!actions.length) return "";
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:26px">
    <tr>
      ${actions
        .map(
          (action) => `<td style="padding:0 10px 10px 0">
            <a href="${escapeHtml(action.href)}" style="display:inline-block;padding:12px 18px;border:1px solid ${action.secondary ? "#6d5c69" : "#d9953d"};background:${action.secondary ? "transparent" : "#d9953d"};color:${action.secondary ? "#f3ecdd" : "#171019"};font-size:13px;font-weight:700;text-decoration:none">
              ${escapeHtml(action.label)}
            </a>
          </td>`,
        )
        .join("")}
    </tr>
  </table>`;
}

export function emailLayout({
  title,
  eyebrow,
  intro,
  content,
  footer,
  actions = [],
}: {
  title: string;
  eyebrow: string;
  intro: string;
  content: string;
  footer: string;
  actions?: EmailAction[];
}) {
  const logoUrl = absoluteSiteUrl("/images/brand-logo.png");
  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#0d0810;color:#f3ecdd;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0810">
      <tr>
        <td align="center" style="padding:32px 14px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid #49384c;background:#171019">
            <tr>
              <td style="padding:28px 38px 20px;border-bottom:1px solid #302432">
                <img src="${escapeHtml(logoUrl)}" width="72" height="72" alt="${escapeHtml(siteName)}" style="display:block;width:72px;height:72px;object-fit:contain;margin:0 0 18px">
                <div style="color:#d9953d;font-size:11px;letter-spacing:2px;text-transform:uppercase">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:12px 0 12px;color:#f3ecdd;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:400;line-height:1.08">${escapeHtml(title)}</h1>
                <p style="margin:0;color:#b6a9a0;font-size:15px;line-height:1.7">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 38px">
                ${content}
                ${actionButtons(actions)}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 38px;border-top:1px solid #302432;color:#83777d;font-size:12px;line-height:1.6">
                ${escapeHtml(footer)}
                <div style="margin-top:8px;color:#c5a36f">${escapeHtml(siteName)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
