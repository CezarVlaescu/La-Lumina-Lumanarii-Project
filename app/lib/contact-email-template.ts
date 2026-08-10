import { contactSubjects, type ContactMessage } from "./contact-model";
import { emailLayout, escapeHtml } from "./email-template";
import { absoluteSiteUrl } from "./site-config";

export type ContactEmailMessage = {
  subject: string;
  html: string;
  text: string;
};

export function buildContactNotificationEmail(
  message: ContactMessage,
): ContactEmailMessage {
  const subjectLabel = contactSubjects[message.subject];
  const customerName = `${message.firstName} ${message.lastName}`.trim();
  const subject = `Mesaj nou de la ${customerName} — ${subjectLabel}`;
  const replyUrl = `mailto:${message.email}?subject=${encodeURIComponent(
    `Re: ${subjectLabel}`,
  )}`;
  const content = `
    <div style="padding:18px;border:1px solid #49384c;background:#120c14">
      <div style="color:#83777d;font-size:10px;letter-spacing:1.4px;text-transform:uppercase">Expeditor</div>
      <div style="margin-top:7px;color:#f3ecdd;font-size:17px">${escapeHtml(customerName)}</div>
      <div style="margin-top:6px;color:#a99ca2;font-size:13px">${escapeHtml(message.email)}</div>
    </div>
    <div style="margin-top:18px;padding:18px;border:1px solid #302432">
      <div style="color:#83777d;font-size:10px;letter-spacing:1.4px;text-transform:uppercase">${escapeHtml(subjectLabel)}</div>
      <p style="margin:12px 0 0;color:#d8cdc3;font-size:14px;line-height:1.75;white-space:pre-wrap">${escapeHtml(message.message)}</p>
    </div>`;

  return {
    subject,
    html: emailLayout({
      title: "Ai primit un mesaj nou.",
      eyebrow: "Formular de contact",
      intro: `${customerName} a trimis un mesaj din pagina Contact.`,
      content,
      footer:
        "Poți răspunde direct acestui email; răspunsul va ajunge la client.",
      actions: [
        {
          label: "Răspunde clientului",
          href: replyUrl,
        },
        {
          label: "Deschide Admin",
          href: absoluteSiteUrl("/admin"),
          secondary: true,
        },
      ],
    }),
    text: `Mesaj nou din formularul de contact\n\nDe la: ${customerName}\nEmail: ${message.email}\nSubiect: ${subjectLabel}\n\n${message.message}\n\nAdministrare: ${absoluteSiteUrl("/admin")}`,
  };
}
