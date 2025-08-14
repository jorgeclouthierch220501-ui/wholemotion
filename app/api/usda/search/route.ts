import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function pickNutrient(nutrients: any[], names: string[], preferUnit?: string) {
  for (const n of nutrients || []) {
    const name = (n?.nutrient?.nutrientName ?? n?.nutrientName ?? "").toLowerCase();
    const unit = (n?.nutrient?.unitName ?? n?.unitName ?? "").toLowerCase();
    if (names.some(t => name === t.toLowerCase())) {
      if (!preferUnit || unit === preferUnit.toLowerCase()) {
        const v = (n as any).amount ?? (n as any).value;
        if (typeof v === "number") return { value: v, unit };
      }
    }
  }
  for (const n of nutrients || []) {
    const name = (n?.nutrient?.nutrientName ?? n?.nutrientName ?? "").toLowerCase();
    if (names.some(t => name === t.toLowerCase())) {
      const v = (n as any).amount ?? (n as any).value;
      const unit = (n?.nutrient?.unitName ?? n?.unitName ?? "").toLowerCase();
      if (typeof v === "number") return { value: v, unit };
    }
  }
  return undefined;
}
const kjToKcal = (kj: number) => kj / 4.184;

function mapFood(item: any) {
  const name: string = item?.description ?? item?.brandName ?? "Food";
  const nutrients: any[] = item?.foodNutrients ?? [];

  let energy = pickNutrient(nutrients, ["Energy"], "kcal");
  if (!energy) {
    const kj = pickNutrient(nutrients, ["Energy"], "kj");
    if (kj) energy = { value: kjToKcal(kj.value), unit: "kcal" };
  }

  const protein = pickNutrient(nutrients, ["Protein"]);
  const fat     = pickNutrient(nutrients, ["Total lipid (fat)", "Total Fat", "Fat"]);
  const carbs   = pickNutrient(nutrients, ["Carbohydrate, by difference", "Carbohydrate"]);

  const per100 = {
    kcal:      Math.round((energy?.value ?? 0) * 10) / 10,
    protein_g: Math.round((protein?.value ?? 0) * 10) / 10,
    fat_g:     Math.round((fat?.value ?? 0) * 10) / 10,
    carbs_g:   Math.round((carbs?.value ?? 0) * 10) / 10
  };

  return { name, per100 };
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing USDA_API_KEY" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ foods: [] });

    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", q);
    url.searchParams.set("pageSize", "10");
    url.searchParams.set("dataType", "Foundation,SR Legacy");

    const r = await fetch(url.toString(), { cache: "no-store" });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: `USDA error: ${text}` }, { status: 502 });
    }

    const data = await r.json();
    const foods = (data?.foods ?? []).map(mapFood).filter((f: any) => {
      const p = f?.per100;
      return p && (p.kcal || p.protein_g || p.fat_g || p.carbs_g);
    });

    return NextResponse.json({ foods });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
