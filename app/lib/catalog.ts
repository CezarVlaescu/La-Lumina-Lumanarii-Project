export type ProductVariant = {
  id: string;
  name: string;
  swatch: string;
  image: string;
  gallery: string[];
  price?: number | null;
  compareAtPrice?: number;
  stock?: number;
};

export type ProductStatus = "draft" | "published" | "archived";

export type Product = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  price: number | null;
  compareAtPrice?: number;
  image: string;
  gallery: string[];
  category: "Decorativă" | "Figurină" | "Recipient";
  collection: string;
  burnTime?: string;
  weight?: string;
  details: string[];
  themes: string[];
  variants?: ProductVariant[];
  tag?: string;
  stock?: number;
  status?: ProductStatus;
  featured?: boolean;
};

export const products: Product[] = [
  {
    slug: "turturele-de-paste",
    name: "Turturele de Paște",
    subtitle: "Lumânare figurină · 2 variante de culoare",
    description:
      "Două turturele așezate una lângă cealaltă, pe o bază decorată cu flori fine. Modelul este disponibil în albastru și roșu, iar fiecare variantă are propria galerie.",
    price: null,
    image: "/images/products/easter/birds/blue-01-floral.png",
    gallery: [
      "/images/products/easter/birds/blue-01-floral.png",
      "/images/products/easter/birds/blue-02-lifestyle.png",
      "/images/products/easter/birds/blue-03-top.png",
      "/images/products/easter/birds/blue-04-back.png",
    ],
    category: "Figurină",
    collection: "Paște",
    details: ["2 culori", "două turturele", "flori pictate manual"],
    themes: ["primavara", "paste", "animale"],
    variants: [
      {
        id: "albastru",
        name: "Albastru",
        swatch: "#26376f",
        image: "/images/products/easter/birds/blue-01-floral.png",
        gallery: [
          "/images/products/easter/birds/blue-01-floral.png",
          "/images/products/easter/birds/blue-02-lifestyle.png",
          "/images/products/easter/birds/blue-03-top.png",
          "/images/products/easter/birds/blue-04-back.png",
        ],
      },
      {
        id: "rosu",
        name: "Roșu",
        swatch: "#7b2936",
        image: "/images/products/easter/birds/red-01-floral.png",
        gallery: [
          "/images/products/easter/birds/red-01-floral.png",
          "/images/products/easter/birds/red-02-lifestyle.png",
          "/images/products/easter/birds/red-03-back.png",
          "/images/products/easter/birds/red-04-front.png",
        ],
      },
    ],
    tag: "Nou · Paște",
  },
  {
    slug: "ou-de-paste-cu-iepuras",
    name: "Ou de Paște cu Iepuraș",
    subtitle: "Lumânare decorativă · 3 variante de culoare",
    description:
      "Un ou de Paște bogat în motive florale, cu un iepuraș modelat în relief. Poate fi ales în albastru, roșu sau roz, fiecare culoare având fotografiile sale.",
    price: null,
    image: "/images/products/easter/bunny-egg/blue-01-floral.png",
    gallery: [
      "/images/products/easter/bunny-egg/blue-01-floral.png",
      "/images/products/easter/bunny-egg/blue-02-lifestyle.png",
      "/images/products/easter/bunny-egg/blue-03-back.png",
    ],
    category: "Decorativă",
    collection: "Paște",
    details: ["3 culori", "iepuraș în relief", "motive florale"],
    themes: ["primavara", "paste", "animale"],
    variants: [
      {
        id: "albastru",
        name: "Albastru",
        swatch: "#27376e",
        image: "/images/products/easter/bunny-egg/blue-01-floral.png",
        gallery: [
          "/images/products/easter/bunny-egg/blue-01-floral.png",
          "/images/products/easter/bunny-egg/blue-02-lifestyle.png",
          "/images/products/easter/bunny-egg/blue-03-back.png",
        ],
      },
      {
        id: "rosu",
        name: "Roșu",
        swatch: "#7d2935",
        image: "/images/products/easter/bunny-egg/red-01-floral.png",
        gallery: [
          "/images/products/easter/bunny-egg/red-01-floral.png",
          "/images/products/easter/bunny-egg/red-02-lifestyle.png",
          "/images/products/easter/bunny-egg/red-03-back.png",
        ],
      },
      {
        id: "roz",
        name: "Roz",
        swatch: "#c95f6d",
        image: "/images/products/easter/bunny-egg/pink-01-floral.png",
        gallery: [
          "/images/products/easter/bunny-egg/pink-01-floral.png",
          "/images/products/easter/bunny-egg/pink-02-front.png",
        ],
      },
    ],
    tag: "Nou · Paște",
  },
  {
    slug: "iepuras-cu-ou-decorat",
    name: "Iepuraș cu Ou Decorat",
    subtitle: "Lumânare figurină · 4 variante de culoare",
    description:
      "Un iepuraș așezat pe un ou de Paște cu textură de tricot și dantelă florală. Modelul poate fi ales în albastru, verde, roz sau roșu, fiecare culoare având propria galerie foto.",
    price: null,
    image: "/images/products/easter/bunny-on-egg/blue-01-floral.png",
    gallery: [
      "/images/products/easter/bunny-on-egg/blue-01-floral.png",
      "/images/products/easter/bunny-on-egg/blue-02-lifestyle.png",
      "/images/products/easter/bunny-on-egg/blue-03-side.png",
    ],
    category: "Figurină",
    collection: "Paște",
    details: ["4 culori", "ou cu dantelă florală", "detalii pictate manual"],
    themes: ["primavara", "paste", "animale"],
    variants: [
      {
        id: "albastru",
        name: "Albastru",
        swatch: "#174c8c",
        image: "/images/products/easter/bunny-on-egg/blue-01-floral.png",
        gallery: [
          "/images/products/easter/bunny-on-egg/blue-01-floral.png",
          "/images/products/easter/bunny-on-egg/blue-02-lifestyle.png",
          "/images/products/easter/bunny-on-egg/blue-03-side.png",
        ],
      },
      {
        id: "verde",
        name: "Verde",
        swatch: "#5f963f",
        image: "/images/products/easter/bunny-on-egg/green-01-floral.png",
        gallery: [
          "/images/products/easter/bunny-on-egg/green-01-floral.png",
          "/images/products/easter/bunny-on-egg/green-02-lifestyle.png",
          "/images/products/easter/bunny-on-egg/green-03-top.png",
        ],
      },
      {
        id: "roz",
        name: "Roz",
        swatch: "#c94d8e",
        image: "/images/products/easter/bunny-on-egg/pink-01-floral.png",
        gallery: [
          "/images/products/easter/bunny-on-egg/pink-01-floral.png",
          "/images/products/easter/bunny-on-egg/pink-02-lifestyle.png",
          "/images/products/easter/bunny-on-egg/pink-03-front.png",
        ],
      },
      {
        id: "rosu",
        name: "Roșu",
        swatch: "#8a3130",
        image: "/images/products/easter/bunny-on-egg/red-01-floral.png",
        gallery: [
          "/images/products/easter/bunny-on-egg/red-01-floral.png",
          "/images/products/easter/bunny-on-egg/red-02-lifestyle.png",
          "/images/products/easter/bunny-on-egg/red-03-side.png",
        ],
      },
    ],
    tag: "Nou · Paște",
  },
  {
    slug: "casuta-lui-mos-craciun",
    name: "Căsuța lui Moș Crăciun",
    subtitle: "Lumânare decorativă · pictată manual",
    description:
      "O căsuță de iarnă cu acoperiș albastru, brăduț și Moș Crăciun, modelată pentru a aduce atmosfera satelor de poveste în decorul sărbătorilor.",
    price: null,
    image: "/images/products/christmas/christmas-house-01-festive-enhanced.png",
    gallery: [
      "/images/products/christmas/christmas-house-01-festive-enhanced.png",
      "/images/products/christmas/christmas-house-02-lifestyle.png",
      "/images/products/christmas/christmas-house-03-front.png",
      "/images/products/christmas/christmas-house-04-back.png",
      "/images/products/christmas/christmas-house-05-close.png",
    ],
    category: "Decorativă",
    collection: "Crăciun",
    details: ["acoperiș albastru", "brăduț verde", "detalii pictate manual"],
    themes: ["iarna", "craciun"],
    tag: "Colecția de Crăciun",
  },
  {
    slug: "omulet-de-turta-dulce",
    name: "Omuleț de Turtă Dulce",
    subtitle: "Lumânare figurină · 3 variante de culoare",
    description:
      "Un omuleț vesel, cu zâmbet și detalii aurii, disponibil în trei combinații pictate diferit. Varianta aleasă schimbă instant fotografiile produsului.",
    price: null,
    image: "/images/products/christmas/gingerbread-light-01-festive-enhanced.png",
    gallery: [
      "/images/products/christmas/gingerbread-light-01-festive-enhanced.png",
      "/images/products/christmas/gingerbread-light-02-side.png",
      "/images/products/christmas/gingerbread-light-03-back.png",
    ],
    category: "Figurină",
    collection: "Crăciun",
    details: ["3 culori", "fundă decorativă", "accente pictate manual"],
    themes: ["iarna", "craciun"],
    variants: [
      {
        id: "maro-deschis",
        name: "Maro deschis",
        swatch: "#918678",
        image: "/images/products/christmas/gingerbread-light-01-festive-enhanced.png",
        gallery: [
          "/images/products/christmas/gingerbread-light-01-festive-enhanced.png",
          "/images/products/christmas/gingerbread-light-02-side.png",
          "/images/products/christmas/gingerbread-light-03-back.png",
        ],
      },
      {
        id: "maro-inchis",
        name: "Maro închis",
        swatch: "#4f4336",
        image: "/images/products/christmas/gingerbread-dark-01-festive-enhanced.png",
        gallery: [
          "/images/products/christmas/gingerbread-dark-01-festive-enhanced.png",
        ],
      },
      {
        id: "alb",
        name: "Alb",
        swatch: "#eeeade",
        image: "/images/products/christmas/gingerbread-white-01-festive-enhanced.png",
        gallery: [
          "/images/products/christmas/gingerbread-white-01-festive-enhanced.png",
          "/images/products/christmas/gingerbread-white-02-lifestyle.png",
          "/images/products/christmas/gingerbread-white-03-side.png",
        ],
      },
    ],
    tag: "Nou",
  },
  {
    slug: "canita-de-craciun",
    name: "Cănița de Crăciun",
    subtitle: "Lumânare în formă de ceașcă · roșu și auriu",
    description:
      "O căniță festivă roșie, cu suprafață aurie și decorațiuni de Crăciun pictate manual. Un accent jucăuș pentru masa sau colțul tău de sărbătoare.",
    price: null,
    image: "/images/products/christmas/christmas-cup-01-festive-enhanced.png",
    gallery: [
      "/images/products/christmas/christmas-cup-01-festive-enhanced.png",
      "/images/products/christmas/christmas-cup-02-angle.png",
      "/images/products/christmas/christmas-cup-03-front.png",
      "/images/products/christmas/christmas-cup-04-front-alt.png",
    ],
    category: "Recipient",
    collection: "Crăciun",
    details: ["roșu festiv", "accente aurii", "mesaj pictat manual"],
    themes: ["iarna", "craciun"],
    tag: "Colecția de Crăciun",
  },
  {
    slug: "cadou-de-craciun",
    name: "Cadou de Crăciun",
    subtitle: "Lumânare decorativă · roșu și auriu",
    description:
      "Un cadou festiv modelat cu panglici și funde aurii, creat pentru a aduce un accent cald și elegant decorului de Crăciun.",
    price: null,
    image: "/images/products/christmas/new-collection/gift-01-festive.png",
    gallery: [
      "/images/products/christmas/new-collection/gift-01-festive.png",
      "/images/products/christmas/new-collection/gift-02-lifestyle.png",
      "/images/products/christmas/new-collection/gift-03-front.png",
      "/images/products/christmas/new-collection/gift-04-top.png",
    ],
    category: "Decorativă",
    collection: "Crăciun",
    details: ["roșu festiv", "panglici aurii", "funde în relief"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "glob-de-craciun-cu-capac",
    name: "Glob de Crăciun cu capac",
    subtitle: "Lumânare în recipient · capac decorativ",
    description:
      "Un glob roșu cu motive aurii de iarnă, realizat ca recipient cu capac. Închis, devine o decorațiune festivă; deschis, dezvăluie lumânarea din interior.",
    price: null,
    image: "/images/products/christmas/new-collection/globe-01-festive.png",
    gallery: [
      "/images/products/christmas/new-collection/globe-01-festive.png",
      "/images/products/christmas/new-collection/globe-02-lifestyle.png",
      "/images/products/christmas/new-collection/globe-03-open.png",
      "/images/products/christmas/new-collection/globe-04-top.png",
    ],
    category: "Recipient",
    collection: "Crăciun",
    details: ["capac detașabil", "motive de iarnă", "accente aurii"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "poveste-de-iarna",
    name: "Poveste de Iarnă",
    subtitle: "Lumânare în recipient · peisaj pictat manual",
    description:
      "Un recipient roz cu brazi, fulgi și daruri modelate în relief, inspirat de liniștea unui peisaj de iarnă luminat în seara de Crăciun.",
    price: null,
    image: "/images/products/christmas/new-collection/winter-story-01-festive.png",
    gallery: [
      "/images/products/christmas/new-collection/winter-story-01-festive.png",
      "/images/products/christmas/new-collection/winter-story-02-lifestyle.png",
      "/images/products/christmas/new-collection/winter-story-03-top.png",
      "/images/products/christmas/new-collection/winter-story-04-back.png",
    ],
    category: "Recipient",
    collection: "Crăciun",
    details: ["brazi în relief", "fulgi argintii", "cadouri colorate"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "saculet-de-craciun-ren",
    name: "Săculeț de Crăciun – Ren",
    subtitle: "Lumânare figurină · model cu ren",
    description:
      "Un săculeț festiv decorat cu un ren, frunze de ilex și bobițe roșii, finisat cu mici accente strălucitoare.",
    price: null,
    image: "/images/products/christmas/new-collection/sack-deer-01-festive.png",
    gallery: [
      "/images/products/christmas/new-collection/sack-deer-01-festive.png",
      "/images/products/christmas/new-collection/sack-deer-02-lifestyle.png",
    ],
    category: "Figurină",
    collection: "Crăciun",
    details: ["ren pictat manual", "frunze de ilex", "accente strălucitoare"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "saculet-de-craciun-brad",
    name: "Săculeț de Crăciun – Brad",
    subtitle: "Lumânare figurină · model cu brad",
    description:
      "Un săculeț roșu decorat cu brad, fundă verde și fulgi argintii, creat ca o mică poveste de Crăciun turnată în ceară.",
    price: null,
    image: "/images/products/christmas/new-collection/sack-tree-01-festive.png",
    gallery: [
      "/images/products/christmas/new-collection/sack-tree-01-festive.png",
      "/images/products/christmas/new-collection/sack-tree-02-lifestyle.png",
      "/images/products/christmas/new-collection/sack-tree-03-top.png",
    ],
    category: "Figurină",
    collection: "Crăciun",
    details: ["brad pictat manual", "fundă verde", "fulgi argintii"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "trenuletul-lui-mos-craciun",
    name: "Trenulețul lui Moș Crăciun",
    subtitle: "Lumânare figurină · alb și auriu",
    description:
      "Un trenuleț de sărbătoare în nuanțe de alb și auriu, cu Moș Crăciun în cabină și detalii atent evidențiate pe roți și locomotivă.",
    price: null,
    image: "/images/products/christmas/new-collection/train-01-festive.png",
    gallery: [
      "/images/products/christmas/new-collection/train-01-festive.png",
      "/images/products/christmas/new-collection/train-02-lifestyle.png",
      "/images/products/christmas/new-collection/train-03-front.png",
    ],
    category: "Figurină",
    collection: "Crăciun",
    details: ["Moș Crăciun în cabină", "roți în relief", "accente aurii"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "casuta-bradut-nins",
    name: "Căsuța-brăduț Nins",
    subtitle: "Lumânare decorativă · căsuță într-un brad",
    description:
      "Un brăduț nins care ascunde la bază o căsuță de poveste, cu ferestre, uși și mici lumini colorate pictate manual.",
    price: null,
    image: "/images/products/christmas/final-collection/house-tree-01-festive.png",
    gallery: [
      "/images/products/christmas/final-collection/house-tree-01-festive.png",
      "/images/products/christmas/final-collection/house-tree-02-lifestyle.png",
      "/images/products/christmas/final-collection/house-tree-04-front.png",
      "/images/products/christmas/final-collection/house-tree-03-back.png",
    ],
    category: "Decorativă",
    collection: "Crăciun",
    details: ["zăpadă în relief", "căsuță la bază", "detalii pictate manual"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "bradut-verde-padure",
    name: "Brăduț Verde Pădure",
    subtitle: "Lumânare decorativă · verde natural",
    description:
      "Un brăduț bogat, în nuanță de verde pădure, cu ramuri suprapuse și o siluetă clasică pentru decorul de Crăciun.",
    price: null,
    image: "/images/products/christmas/final-collection/tree-forest-01-festive.png",
    gallery: [
      "/images/products/christmas/final-collection/tree-forest-01-festive.png",
      "/images/products/christmas/final-collection/tree-forest-02-front.png",
    ],
    category: "Decorativă",
    collection: "Crăciun",
    details: ["verde pădure", "ramuri bogate", "formă clasică"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "bradut-albastru-petrol",
    name: "Brăduț Albastru Petrol",
    subtitle: "Lumânare decorativă · albastru-verzui",
    description:
      "Un brăduț cu ramuri ample și nuanță albastru-petrol, creat pentru un decor de sărbătoare mai profund și neobișnuit.",
    price: null,
    image: "/images/products/christmas/final-collection/tree-teal-01-festive.png",
    gallery: [
      "/images/products/christmas/final-collection/tree-teal-01-festive.png",
      "/images/products/christmas/final-collection/tree-teal-02-front.png",
      "/images/products/christmas/final-collection/tree-teal-03-front-alt.png",
    ],
    category: "Decorativă",
    collection: "Crăciun",
    details: ["albastru-petrol", "ramuri ample", "textură fină"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "bradut-verde-luminos",
    name: "Brăduț Verde Luminos",
    subtitle: "Lumânare decorativă · verde viu",
    description:
      "Un brăduț vesel, într-o nuanță verde luminoasă, cu niveluri ondulate care îi dau o formă jucăușă și festivă.",
    price: null,
    image: "/images/products/christmas/final-collection/tree-bright-01-festive.png",
    gallery: [
      "/images/products/christmas/final-collection/tree-bright-01-festive.png",
      "/images/products/christmas/final-collection/tree-bright-02-front.png",
    ],
    category: "Decorativă",
    collection: "Crăciun",
    details: ["verde luminos", "niveluri ondulate", "aspect lucios"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "bradut-verde-pastel",
    name: "Brăduț Verde Pastel",
    subtitle: "Lumânare decorativă · verde deschis",
    description:
      "Un brăduț delicat, în verde pastel, cu ramuri fine și o formă înaltă, potrivită pentru decoruri de iarnă luminoase.",
    price: null,
    image: "/images/products/christmas/final-collection/tree-pastel-01-festive.png",
    gallery: [
      "/images/products/christmas/final-collection/tree-pastel-01-festive.png",
      "/images/products/christmas/final-collection/tree-pastel-02-front.png",
    ],
    category: "Decorativă",
    collection: "Crăciun",
    details: ["verde pastel", "ramuri fine", "siluetă înaltă"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
  {
    slug: "bradut-alb-perlat",
    name: "Brăduț Alb Perlat",
    subtitle: "Lumânare decorativă · alb sidefat",
    description:
      "Un brăduț alb cu reflexe sidefate și textură bogată, inspirat de zăpada care strălucește în lumina sărbătorilor.",
    price: null,
    image: "/images/products/christmas/final-collection/tree-white-01-festive.png",
    gallery: [
      "/images/products/christmas/final-collection/tree-white-01-festive.png",
      "/images/products/christmas/final-collection/tree-white-02-front.png",
    ],
    category: "Decorativă",
    collection: "Crăciun",
    details: ["alb sidefat", "textură bogată", "aspect de zăpadă"],
    themes: ["iarna", "craciun"],
    tag: "Nou",
  },
];

export type CollectionTheme = {
  name: string;
  slug: string;
  description: string;
};

export type SeasonalCollectionGroup = CollectionTheme & {
  icon: string;
  visual: string;
  children: CollectionTheme[];
};

export const seasonalCollectionGroups: SeasonalCollectionGroup[] = [
  {
    name: "Primăvară",
    slug: "primavara",
    icon: "✿",
    description: "Prospețime, flori și lumină blândă.",
    visual: "Petale, verde salvie și tonuri pastelate",
    children: [
      {
        name: "8 Martie",
        slug: "8-martie",
        description: "Daruri delicate pentru femeile dragi.",
      },
      {
        name: "Valentine’s Day",
        slug: "valentines",
        description: "Inimi, catifea și seri romantice.",
      },
      {
        name: "Floral",
        slug: "floral",
        description: "Buchete parfumate și forme botanice.",
      },
      {
        name: "Paște",
        slug: "paste",
        description: "Culori luminoase și decoruri de sărbătoare.",
      },
    ],
  },
  {
    name: "Vară",
    slug: "vara",
    icon: "☼",
    description: "Zile senine și seri cu aer de vacanță.",
    visual: "Mare, umbreluțe și albastru luminos",
    children: [],
  },
  {
    name: "Toamnă",
    slug: "toamna",
    icon: "❧",
    description: "Arome cozy, frunze și lumină arămie.",
    visual: "Frunze, dovleac și tonuri de cupru",
    children: [
      {
        name: "Halloween",
        slug: "halloween",
        description: "Dovleci, umbre și o atmosferă jucăuș-misterioasă.",
      },
    ],
  },
  {
    name: "Iarnă",
    slug: "iarna",
    icon: "❄",
    description: "Liniștea zăpezii și seri calde în casă.",
    visual: "Zăpadă, fulgi și om de zăpadă",
    children: [
      {
        name: "Crăciun",
        slug: "craciun",
        description: "Brad, decorațiuni și luminițe aurii.",
      },
    ],
  },
];

export const specialThemeCollections: CollectionTheme[] = [
  {
    name: "Animale",
    slug: "animale",
    description: "Forme simpatice și personaje modelate manual.",
  },
  {
    name: "Religioase",
    slug: "religioase",
    description: "Lumânări simbolice pentru momente cu însemnătate.",
  },
];

export const allCollectionThemes: CollectionTheme[] = [
  ...seasonalCollectionGroups.flatMap((group) => [
    {
      name: group.name,
      slug: group.slug,
      description: group.description,
    },
    ...group.children,
  ]),
  ...specialThemeCollections,
];

export const collections = [
  {
    name: "Paște",
    description: "Iepurași, ouă și figurine în culori luminoase pentru masa și decorul de sărbătoare.",
    image: "/images/products/easter/bunny-on-egg/all-colors.jpg",
    href: "/lumanari?tema=paste",
  },
  {
    name: "Crăciun",
    description: "Căsuțe, figurine și forme festive pictate manual pentru decorul sărbătorilor.",
    image: "/images/products/christmas/final-collection/trees-group-02-lifestyle.png",
    href: "/lumanari?tema=craciun",
  },
  {
    name: "Iarnă",
    description: "Lumini inspirate de zăpadă, seri liniștite și povești spuse la căldură.",
    image: "/images/products/christmas/gingerbread-white-02-lifestyle.png",
    href: "/lumanari?tema=iarna",
  },
] as const;

export function getProductVariant(product: Product, variantId?: string) {
  return product.variants?.find((variant) => variant.id === variantId);
}

export function getProductPrice(product: Product, variantId?: string) {
  return getProductVariant(product, variantId)?.price ?? product.price;
}

export function getProductCompareAtPrice(product: Product, variantId?: string) {
  return (
    getProductVariant(product, variantId)?.compareAtPrice ??
    product.compareAtPrice ??
    null
  );
}

export function getProductStock(product: Product, variantId?: string) {
  if (product.variants?.length) {
    const variant =
      getProductVariant(product, variantId) ?? product.variants[0];
    return variant?.stock ?? 0;
  }
  return product.stock ?? 0;
}

export function formatPrice(value: number | null) {
  if (value === null) return "Preț în curând";
  return `${value.toLocaleString("ro-RO")} lei`;
}
