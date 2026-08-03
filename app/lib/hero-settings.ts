import {
  readStoreSetting,
  writeStoreSetting,
} from "./settings-repository";

export type HeroTheme = {
  id: string;
  name: string;
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  desktopImage: string;
  mobileImage: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
  accentSoftColor: string;
  overlayColor: string;
};

export type HeroSettings = {
  mode: "automatic" | "manual";
  manualThemeId: string;
  themes: HeroTheme[];
};

const standardTheme: HeroTheme = {
  id: "standard",
  name: "Standard",
  enabled: true,
  startsAt: "",
  endsAt: "",
  desktopImage: "/images/hero-ritual-nocturn.webp",
  mobileImage: "/images/hero-ritual-nocturn.webp",
  imageAlt: "Lumânare artizanală într-un decor nocturn mov",
  eyebrow: "Turnate manual în România",
  title: "Aprinde momentele care contează.",
  subtitle:
    "Lumânări artizanale modelate și pictate manual, create pentru seri care rămân în suflet.",
  primaryLabel: "Descoperă colecția",
  primaryHref: "/lumanari",
  secondaryLabel: "Povestea noastră",
  secondaryHref: "/poveste",
  backgroundColor: "#0d0710",
  surfaceColor: "#1b131d",
  textColor: "#f3ecdd",
  accentColor: "#d9953d",
  accentSoftColor: "#f0bd72",
  overlayColor: "#0c0610",
};

function collectionTheme(
  id: string,
  name: string,
  values: Partial<HeroTheme>,
): HeroTheme {
  return {
    ...standardTheme,
    id,
    name,
    enabled: false,
    desktopImage: `/images/themes/theme-${id}.webp`,
    mobileImage: `/images/themes/theme-${id}.webp`,
    primaryHref: `/lumanari?tema=${id}`,
    ...values,
  };
}

export const defaultHeroSettings: HeroSettings = {
  mode: "automatic",
  manualThemeId: "standard",
  themes: [
    standardTheme,
    collectionTheme("primavara", "Primăvară", {
      imageAlt: "Grădină de primăvară cu ramuri înflorite și lumină blândă",
      eyebrow: "Colecția Primăvară",
      title: "Un nou anotimp prinde lumină.",
      subtitle:
        "Petale, prospețime și tonuri delicate pentru zilele care încep din nou.",
      primaryLabel: "Descoperă primăvara",
      backgroundColor: "#101711",
      surfaceColor: "#1f2a21",
      textColor: "#f7f0e7",
      accentColor: "#d982a3",
      accentSoftColor: "#c9dca7",
      overlayColor: "#101a13",
    }),
    collectionTheme("8-martie", "8 Martie", {
      imageAlt: "Buchet elegant de flori în lumină caldă de început de martie",
      eyebrow: "Colecția 8 Martie",
      title: "Un dar spus prin culoare.",
      subtitle:
        "Forme delicate și gesturi luminoase pentru femeile care îți fac lumea mai frumoasă.",
      primaryLabel: "Descoperă colecția",
      backgroundColor: "#1b0d15",
      surfaceColor: "#2d1823",
      textColor: "#fbf0ec",
      accentColor: "#c95f7d",
      accentSoftColor: "#efb7a6",
      overlayColor: "#210f19",
    }),
    collectionTheme("valentines", "Valentine’s Day", {
      imageAlt: "Trandafiri și catifea într-un decor romantic sofisticat",
      eyebrow: "Colecția Valentine’s Day",
      title: "Aprinde o poveste în doi.",
      subtitle:
        "Roșu catifelat, lumină intimă și detalii create pentru seri care rămân aproape.",
      primaryLabel: "Descoperă Valentine’s",
      backgroundColor: "#16070d",
      surfaceColor: "#2a0f19",
      textColor: "#fff1ee",
      accentColor: "#c73752",
      accentSoftColor: "#f3a0aa",
      overlayColor: "#19070d",
    }),
    collectionTheme("floral", "Floral", {
      imageAlt: "Flori de grădină și frunze într-o compoziție botanică",
      eyebrow: "Colecția Floral",
      title: "Grădina intră în poveste.",
      subtitle:
        "Petale, frunze și culori botanice pentru un decor viu în orice anotimp.",
      primaryLabel: "Descoperă colecția Floral",
      backgroundColor: "#101712",
      surfaceColor: "#1d2b22",
      textColor: "#f5f0e5",
      accentColor: "#9b72b2",
      accentSoftColor: "#d2b8dc",
      overlayColor: "#101813",
    }),
    collectionTheme("paste", "Paște", {
      imageAlt: "Ouă pictate și ramuri înflorite într-un decor de Paște",
      eyebrow: "Colecția de Paște",
      title: "Primăvara prinde lumină.",
      subtitle:
        "Iepurași, ouă și culori delicate, turnate și finisate manual pentru masa de sărbătoare.",
      primaryLabel: "Descoperă Paștele",
      backgroundColor: "#18101a",
      surfaceColor: "#2a1d2b",
      textColor: "#fff4ed",
      accentColor: "#e7a7b7",
      accentSoftColor: "#b9d8b1",
      overlayColor: "#25121f",
    }),
    collectionTheme("vara", "Vară", {
      imageAlt: "Terasă mediteraneană luminoasă cu vedere spre mare",
      eyebrow: "Colecția Vară",
      title: "Păstrează soarele aproape.",
      subtitle:
        "Albastru senin, seri lungi și aer de vacanță pentru casa ta.",
      primaryLabel: "Descoperă vara",
      backgroundColor: "#07171d",
      surfaceColor: "#102b35",
      textColor: "#fff5df",
      accentColor: "#e97955",
      accentSoftColor: "#f4c86d",
      overlayColor: "#071a22",
    }),
    collectionTheme("toamna", "Toamnă", {
      imageAlt: "Frunze ruginii, dovleci și lumină arămie de toamnă",
      eyebrow: "Colecția Toamnă",
      title: "Sezonul serilor tihnite.",
      subtitle:
        "Frunze, texturi calde și tonuri de cupru pentru momente cu parfum de acasă.",
      primaryLabel: "Descoperă toamna",
      backgroundColor: "#160d08",
      surfaceColor: "#2d1a10",
      textColor: "#f8ead8",
      accentColor: "#c66b2f",
      accentSoftColor: "#e6ae64",
      overlayColor: "#1b0f09",
    }),
    collectionTheme("halloween", "Halloween", {
      imageAlt: "Dovleci sculptați într-un decor misterios de Halloween",
      eyebrow: "Colecția Halloween",
      title: "Puțină magie după lăsarea serii.",
      subtitle:
        "Dovleci, umbre și accente jucăușe pentru cea mai misterioasă noapte de toamnă.",
      primaryLabel: "Descoperă Halloween",
      backgroundColor: "#0d0912",
      surfaceColor: "#21132b",
      textColor: "#fff1d6",
      accentColor: "#e46f24",
      accentSoftColor: "#b6ce5a",
      overlayColor: "#100914",
    }),
    collectionTheme("iarna", "Iarnă", {
      imageAlt: "Peisaj liniștit de iarnă cu zăpadă și lumină albastră",
      eyebrow: "Colecția Iarnă",
      title: "Liniștea zăpezii, înăuntru.",
      subtitle:
        "Fulgi, alb perlat și albastru rece pentru seri calme la căldură.",
      primaryLabel: "Descoperă iarna",
      backgroundColor: "#08111d",
      surfaceColor: "#14253a",
      textColor: "#f3f7fb",
      accentColor: "#7fa7ca",
      accentSoftColor: "#d8e8f4",
      overlayColor: "#091321",
    }),
    collectionTheme("craciun", "Crăciun", {
      imageAlt: "Brad împodobit și lumini aurii într-un decor de Crăciun",
      eyebrow: "Colecția de Crăciun",
      title: "Aprinde povestea sărbătorilor.",
      subtitle:
        "Forme de iarnă și lumină caldă, pregătite în atelier pentru seri petrecute împreună.",
      primaryLabel: "Descoperă Crăciunul",
      backgroundColor: "#07130f",
      surfaceColor: "#10271f",
      textColor: "#fff5e7",
      accentColor: "#d7a84a",
      accentSoftColor: "#efcd7e",
      overlayColor: "#07140f",
    }),
    collectionTheme("animale", "Animale", {
      imageAlt: "Animale de pădure într-un decor natural, cald și jucăuș",
      eyebrow: "Colecția Animale",
      title: "Personaje mici, bucurii mari.",
      subtitle:
        "Forme simpatice inspirate din natură, create pentru cadouri și colțuri cu personalitate.",
      primaryLabel: "Descoperă Animale",
      backgroundColor: "#11130d",
      surfaceColor: "#25281a",
      textColor: "#f5eddc",
      accentColor: "#b77c42",
      accentSoftColor: "#c9bc79",
      overlayColor: "#11140d",
    }),
    collectionTheme("religioase", "Religioase", {
      imageAlt: "Lumină prin vitralii, pânză naturală și ramură de măslin",
      eyebrow: "Colecția Religioasă",
      title: "Lumină pentru momente cu însemnătate.",
      subtitle:
        "Forme simbolice și o paletă solemnă pentru clipe de reculegere, speranță și apropiere.",
      primaryLabel: "Descoperă colecția",
      backgroundColor: "#0b101b",
      surfaceColor: "#171f31",
      textColor: "#f7f0e3",
      accentColor: "#b48a45",
      accentSoftColor: "#dfc58c",
      overlayColor: "#0b111d",
    }),
  ],
};

const SETTINGS_KEY = "hero-themes";

function text(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength) || fallback
    : fallback;
}

function optionalDate(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function safeHref(value: unknown, fallback: string) {
  const href = text(value, fallback, 240);
  return href.startsWith("/") && !href.startsWith("//") ? href : fallback;
}

function imageUrl(value: unknown, fallback: string) {
  const url = text(value, fallback, 800);
  return url.startsWith("/") || /^https:\/\/[^\s]+$/i.test(url)
    ? url
    : fallback;
}

function color(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : fallback;
}

function normalizeTheme(value: unknown, fallback: HeroTheme): HeroTheme {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    id: fallback.id,
    name: text(candidate.name, fallback.name, 50),
    enabled:
      fallback.id === "standard"
        ? true
        : typeof candidate.enabled === "boolean"
          ? candidate.enabled
          : fallback.enabled,
    startsAt: optionalDate(candidate.startsAt),
    endsAt: optionalDate(candidate.endsAt),
    desktopImage: imageUrl(candidate.desktopImage, fallback.desktopImage),
    mobileImage: imageUrl(candidate.mobileImage, fallback.mobileImage),
    imageAlt: text(candidate.imageAlt, fallback.imageAlt, 180),
    eyebrow: text(candidate.eyebrow, fallback.eyebrow, 90),
    title: text(candidate.title, fallback.title, 130),
    subtitle: text(candidate.subtitle, fallback.subtitle, 280),
    primaryLabel: text(candidate.primaryLabel, fallback.primaryLabel, 70),
    primaryHref: safeHref(candidate.primaryHref, fallback.primaryHref),
    secondaryLabel: text(
      candidate.secondaryLabel,
      fallback.secondaryLabel,
      70,
    ),
    secondaryHref: safeHref(
      candidate.secondaryHref,
      fallback.secondaryHref,
    ),
    backgroundColor: color(
      candidate.backgroundColor,
      fallback.backgroundColor,
    ),
    surfaceColor: color(candidate.surfaceColor, fallback.surfaceColor),
    textColor: color(candidate.textColor, fallback.textColor),
    accentColor: color(candidate.accentColor, fallback.accentColor),
    accentSoftColor: color(
      candidate.accentSoftColor,
      fallback.accentSoftColor,
    ),
    overlayColor: color(candidate.overlayColor, fallback.overlayColor),
  };
}

export function normalizeHeroSettings(value: unknown): HeroSettings {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const rawThemes = Array.isArray(candidate.themes) ? candidate.themes : [];
  const themes = defaultHeroSettings.themes.map((fallback) => {
    const saved = rawThemes.find(
      (theme) =>
        theme &&
        typeof theme === "object" &&
        (theme as { id?: unknown }).id === fallback.id,
    );
    return normalizeTheme(saved, fallback);
  });
  const requestedManualTheme = text(
    candidate.manualThemeId,
    "standard",
    30,
  );
  return {
    mode: candidate.mode === "manual" ? "manual" : "automatic",
    manualThemeId: themes.some((theme) => theme.id === requestedManualTheme)
      ? requestedManualTheme
      : "standard",
    themes,
  };
}

export async function getHeroSettings() {
  return normalizeHeroSettings(
    await readStoreSetting(SETTINGS_KEY, defaultHeroSettings),
  );
}

export async function saveHeroSettings(value: unknown) {
  const settings = normalizeHeroSettings(value);
  return writeStoreSetting(SETTINGS_KEY, settings);
}

export function resolveActiveHero(
  settings: HeroSettings,
  now = new Date(),
): HeroTheme {
  if (settings.mode === "manual") {
    return (
      settings.themes.find(
        (theme) => theme.id === settings.manualThemeId,
      ) ?? settings.themes[0]
    );
  }
  const today = now.toISOString().slice(0, 10);
  const seasonal = settings.themes
    .filter(
      (theme) =>
        theme.id !== "standard" &&
        theme.enabled &&
        (!theme.startsAt || theme.startsAt <= today) &&
        (!theme.endsAt || theme.endsAt >= today),
    )
    .sort((a, b) => (b.startsAt || "").localeCompare(a.startsAt || ""))[0];
  return seasonal ?? settings.themes[0] ?? standardTheme;
}
