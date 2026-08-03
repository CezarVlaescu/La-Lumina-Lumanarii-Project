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

test("renders the public storefront routes", async () => {
  const routes = [
    "/",
    "/lumanari",
    "/lumanari/turturele-de-paste",
    "/colectii",
    "/poveste",
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


test("renders the dynamic homepage sections", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Cele mai vândute/);
  assert.match(html, /Oferta săptămânii/);
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
