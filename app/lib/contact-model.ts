export const contactSubjects = {
  comanda: "Întrebare despre o comandă",
  produse: "Ajutor în alegerea produsului",
  colaborare: "Colaborare sau cadouri corporate",
  altceva: "Altceva",
} as const;

export type ContactSubject = keyof typeof contactSubjects;
export type ContactMessageStatus = "new" | "read" | "closed";

export type ContactMessage = {
  id: string;
  status: ContactMessageStatus;
  firstName: string;
  lastName: string;
  email: string;
  subject: ContactSubject;
  message: string;
  createdAt: string;
  updatedAt: string;
};

function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} este obligatoriu.`);
  }
  const result = value.trim();
  if (result.length > maxLength) {
    throw new Error(`${label} este prea lung.`);
  }
  return result;
}

export function parseContactMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new Error("Mesajul nu este valid.");
  }
  const candidate = value as Record<string, unknown>;
  const email = requiredText(candidate.email, "Emailul", 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Adresa de email nu este validă.");
  }
  const subject = requiredText(candidate.subject, "Subiectul", 30);
  if (!(subject in contactSubjects)) {
    throw new Error("Subiectul nu este valid.");
  }
  return {
    firstName: requiredText(candidate.firstName, "Prenumele", 80),
    lastName: requiredText(candidate.lastName, "Numele", 80),
    email,
    subject: subject as ContactSubject,
    message: requiredText(candidate.message, "Mesajul", 2000),
    honeypot:
      typeof candidate.companyWebsite === "string"
        ? candidate.companyWebsite.trim()
        : "",
  };
}
