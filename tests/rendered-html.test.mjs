import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then((module) => module.default);

const runtimeEnv = {
  ADMIN_EMAILS: "admin@example.com",
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const executionContext = {
  waitUntil() {},
  passThroughOnException() {},
};

async function request(path, init) {
  const worker = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", ...init?.headers },
      ...init,
    }),
    runtimeEnv,
    executionContext,
  );
}

function jsonMutation(path, body, init = {}) {
  return request(path, {
    method: "POST",
    ...init,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      ...init.headers,
    },
    body: JSON.stringify(body),
  });
}

const validCheckout = {
  checkoutAttemptId: "123e4567-e89b-42d3-a456-426614174000",
  paymentMethod: "cash_on_delivery",
  shippingMethod: "sameday_address",
  email: "client@example.com",
  firstName: "Ana",
  lastName: "Popescu",
  phone: "0712345678",
  addressLine: "Strada Exemplu 10",
  city: "Cluj-Napoca",
  county: "Cluj",
  postalCode: "400001",
  acceptsTerms: true,
  lines: [{ productSlug: "bradut-alb-perlat", quantity: 1 }],
};

test("renders the public storefront routes", async () => {
  const routes = [
    "/",
    "/lumanari",
    "/lumanari/bradut-alb-perlat",
    "/colectii",
    "/poveste",
    "/ghid-parfum",
    "/ingrijire",
    "/contact",
    "/livrare-retur",
    "/termeni",
    "/confidentialitate",
    "/cookie-uri",
    "/formular-retragere",
    "/checkout",
    "/cont",
    "/cont/autentificare",
    "/cont/resetare-parola",
  ];

  for (const route of routes) {
    const response = await request(route);
    assert.equal(response.status, 200, `${route} should render`);
    assert.match(
      response.headers.get("content-type") ?? "",
      /^text\/html\b/i,
      `${route} should return HTML`,
    );
  }
});


test("renders only honest homepage sections", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Alese din atelier/);
  assert.doesNotMatch(html, /Cele mai vândute/);
  assert.doesNotMatch(html, /Oferta săptămânii/);
  assert.doesNotMatch(html, /Turturele de Paște/);
});

test("publishes only products with complete commerce data", async () => {
  const catalogResponse = await request("/lumanari");
  assert.equal(catalogResponse.status, 200);
  const catalogHtml = await catalogResponse.text();
  assert.match(catalogHtml, /Brăduț Alb Perlat/);
  assert.doesNotMatch(catalogHtml, /Turturele de Paște/);

  const productResponse = await request("/lumanari/bradut-alb-perlat");
  assert.equal(productResponse.status, 200);
  const productHtml = await productResponse.text();
  assert.match(productHtml, /20(?:,00)?(?:&nbsp;|\s)lei/);
  assert.match(productHtml, /350 g/);

  const incompleteResponse = await request("/lumanari/turturele-de-paste");
  assert.equal(incompleteResponse.status, 404);
  assert.match(await incompleteResponse.text(), /Pagina nu a fost găsită/);
});

test("uses the Romanian custom not-found page", async () => {
  const response = await request("/pagina-care-nu-exista");
  assert.equal(response.status, 404);
  const html = await response.text();
  assert.match(html, /<html[^>]+lang=["']ro["']/i);
  assert.match(html, /Pagina nu a fost găsită/);
  assert.match(html, /Eroare 404/);
  assert.match(html, /noindex/i);
});

test("keeps incomplete products and the inactive guide out of the sitemap", async () => {
  const response = await request("/sitemap.xml");
  assert.equal(response.status, 200);
  const xml = await response.text();
  assert.match(xml, /\/lumanari\/bradut-alb-perlat/);
  assert.doesNotMatch(xml, /turturele-de-paste/);
  assert.doesNotMatch(xml, /ghid-parfum/);
});

test("sets canonical metadata on primary content pages", async () => {
  for (const path of ["/colectii", "/poveste", "/ingrijire"]) {
    const response = await request(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(
      html,
      new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']*${path}["']`, "i"),
      `${path} should expose its own canonical URL`,
    );
  }
});

test("does not expose implementation notes in public account and contact pages", async () => {
  const pages = await Promise.all([
    request("/cont"),
    request("/cont/autentificare"),
    request("/contact"),
  ]);
  const html = (await Promise.all(pages.map((response) => response.text()))).join("\n");
  assert.doesNotMatch(html, /Supabase|versiunea finală Netlify|completează din Admin|panoul magazinului/i);
});

test("renders development preview metadata", async () => {
  const response = await request("/");
  assert.match(await response.text(), developmentPreviewMeta);
});

test("keeps admin behind authentication", async () => {
  const response = await request("/admin", { redirect: "manual" });
  assert.equal(response.status, 307);
  assert.match(
    response.headers.get("location") ?? "",
    /^http:\/\/localhost\/signin-with-chatgpt\?return_to=%2Fadmin$/,
  );
});

test("does not grant admin access to an ordinary authenticated member", async () => {
  const response = await request("/admin", {
    redirect: "manual",
    headers: {
      "oai-authenticated-user-email": "membru@example.com",
    },
  });
  assert.equal(response.status, 307);
  assert.match(
    response.headers.get("location") ?? "",
    /^http:\/\/localhost\/signin-with-chatgpt\?return_to=%2Fadmin$/,
  );
});

test("shows a direct administration link to an authenticated administrator", async () => {
  const response = await request("/", {
    headers: {
      "oai-authenticated-user-email": "admin@example.com",
      "oai-authenticated-user-full-name": "Ana%20Administrator",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /href=["']\/admin["']/);
  assert.match(html, /Deschide administrarea magazinului/);
});

test("rejects cross-origin checkout mutations", async () => {
  const response = await request("/api/orders", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "https://invalid.example",
    },
    body: "{}",
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: "Originea cererii nu este acceptată.",
  });
});

test("validates checkout input before accessing inventory", async () => {
  const response = await request("/api/orders", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: "{}",
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Emailul este obligatoriu.",
  });
});

test("requires consent before creating a checkout order", async () => {
  const response = await jsonMutation("/api/orders", {
    ...validCheckout,
    acceptsTerms: false,
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Trebuie să accepți termenii și condițiile.",
  });
});

test("validates the complete Stripe checkout before reporting availability", async () => {
  const response = await jsonMutation("/api/orders", {
    ...validCheckout,
    paymentMethod: "stripe",
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error:
      "Plata online este pregătită, dar nu este încă activată. Alege plata ramburs.",
  });
});

test("keeps checkout available while legal details are being completed", async () => {
  const response = await request("/checkout");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.doesNotMatch(html, /Comenzile nu sunt deschise încă/);
  assert.match(html, /Pregătim checkoutul/);
});

test("protects and validates the contact endpoint", async () => {
  const crossOrigin = await jsonMutation(
    "/api/contact",
    {},
    { headers: { origin: "https://invalid.example" } },
  );
  assert.equal(crossOrigin.status, 403);
  assert.deepEqual(await crossOrigin.json(), {
    error: "Originea cererii nu este acceptată.",
  });

  const invalid = await jsonMutation("/api/contact", {});
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), {
    error: "Emailul este obligatoriu.",
  });

  const honeypot = await jsonMutation("/api/contact", {
    firstName: "Test",
    lastName: "Automat",
    email: "test@example.com",
    subject: "altceva",
    message: "Mesaj automat de verificare.",
    companyWebsite: "https://spam.example",
  });
  assert.equal(honeypot.status, 201);
  assert.deepEqual(await honeypot.json(), { ok: true });
});

test("protects and validates account authentication endpoints", async () => {
  const registerCrossOrigin = await jsonMutation(
    "/api/account/auth/register",
    {},
    { headers: { origin: "https://invalid.example" } },
  );
  assert.equal(registerCrossOrigin.status, 403);

  const weakPassword = await jsonMutation("/api/account/auth/register", {
    firstName: "Ana",
    lastName: "Popescu",
    email: "ana@example.com",
    password: "scurta",
  });
  assert.equal(weakPassword.status, 400);
  assert.deepEqual(await weakPassword.json(), {
    error: "Parola trebuie să aibă cel puțin 10 caractere.",
  });

  const missingLogin = await jsonMutation("/api/account/auth/login", {});
  assert.equal(missingLogin.status, 400);
  assert.deepEqual(await missingLogin.json(), {
    error: "Completează emailul și parola.",
  });

  const missingRecovery = await jsonMutation("/api/account/auth/recover", {});
  assert.equal(missingRecovery.status, 400);
  assert.deepEqual(await missingRecovery.json(), {
    error: "Completează adresa de email.",
  });

  const recovery = await jsonMutation("/api/account/auth/recover", {
    email: "necunoscut@example.com",
  });
  assert.equal(recovery.status, 200);
  assert.deepEqual(await recovery.json(), {
    ok: true,
    message:
      "Dacă există un cont pentru această adresă, vei primi instrucțiunile de resetare.",
  });
});

test("logout rejects an external return destination", async () => {
  const response = await request("/api/account/auth/logout?returnTo=//evil.example", {
    redirect: "manual",
  });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "http://localhost/");
  assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/i);
});
