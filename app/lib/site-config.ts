export const siteName = "La Lumina Lumânării";
export const siteDescription =
  "Lumânări artizanale modelate și pictate manual în România, în colecții inspirate de anotimpuri și sărbători.";
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://la-lumina-lumanarii.vlaescucezar.chatgpt.site";

export function absoluteSiteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
