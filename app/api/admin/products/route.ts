import { NextResponse } from "next/server";
import { getAdminUser } from "../../../lib/admin-auth";
import {
  getAdminProducts,
  saveCatalogProduct,
} from "../../../lib/catalog-repository";
import { parseProductInput } from "../../../lib/product-input";
import { isSameOriginMutation } from "../../../lib/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });

  return NextResponse.json({ products: await getAdminProducts() });
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }

  try {
    const product = parseProductInput(await request.json());
    const existing = (await getAdminProducts()).some(
      (entry) => entry.slug === product.slug,
    );
    if (existing) {
      return NextResponse.json(
        { error: "Există deja un produs cu acest identificator URL." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { product: await saveCatalogProduct(product) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Produsul nu a putut fi salvat." },
      { status: 400 },
    );
  }
}
