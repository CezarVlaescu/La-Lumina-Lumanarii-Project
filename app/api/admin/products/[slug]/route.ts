import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin-auth";
import {
  archiveCatalogProduct,
  getAdminProducts,
  saveCatalogProduct,
} from "../../../../lib/catalog-repository";
import { parseProductInput } from "../../../../lib/product-input";
import { isSameOriginMutation } from "../../../../lib/request-security";

export const dynamic = "force-dynamic";

type ProductRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function PUT(request: Request, { params }: ProductRouteProps) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }

  try {
    const { slug } = await params;
    const product = parseProductInput(await request.json());
    if (slug !== product.slug) {
      const collision = (await getAdminProducts()).some(
        (entry) => entry.slug === product.slug,
      );
      if (collision) {
        return NextResponse.json(
          { error: "Există deja un produs cu noul identificator URL." },
          { status: 409 },
        );
      }
      await archiveCatalogProduct(slug);
    }

    return NextResponse.json({ product: await saveCatalogProduct(product) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Produsul nu a putut fi actualizat." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: ProductRouteProps) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Originea cererii nu este acceptată." },
      { status: 403 },
    );
  }

  const { slug } = await params;
  await archiveCatalogProduct(slug);
  return NextResponse.json({ ok: true });
}
