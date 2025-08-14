export type Nutrients = { kcal: number; protein_g: number; fat_g: number; carbs_g: number };
export type Food = {
  name: string;
  per100: Nutrients;          // per 100 g
  dietTags: ("omnivore" | "vegetarian" | "vegan")[];
  allergens?: string[];       // e.g., ["peanut"]
};

export const FOODS: Food[] = [
  { name: "chicken breast (cooked)", per100: { kcal:165, protein_g:31, fat_g:3.6, carbs_g:0 }, dietTags:["omnivore"] },
  { name: "salmon (baked)",          per100: { kcal:208, protein_g:20, fat_g:13, carbs_g:0  }, dietTags:["omnivore"] },
  { name: "egg (whole)",              per100: { kcal:155, protein_g:13, fat_g:11, carbs_g:1.1}, dietTags:["omnivore"] },

  { name: "tofu (firm)",              per100: { kcal:76,  protein_g:8,  fat_g:4.8, carbs_g:1.9}, dietTags:["vegetarian","vegan"] },
  { name: "tempeh",                   per100: { kcal:193, protein_g:20, fat_g:11, carbs_g:7.6}, dietTags:["vegetarian","vegan"] },
  { name: "beans (cooked)",           per100: { kcal:127, protein_g:8.7,fat_g:0.5,carbs_g:22 }, dietTags:["vegetarian","vegan"] },
  { name: "lentils (cooked)",         per100: { kcal:116, protein_g:9,  fat_g:0.4,carbs_g:20 }, dietTags:["vegetarian","vegan"] },
  { name: "greek yogurt 0% fat",      per100: { kcal:59,  protein_g:10, fat_g:0.4,carbs_g:3.6}, dietTags:["vegetarian"] },

  { name: "rice (cooked)",            per100: { kcal:130, protein_g:2.4,fat_g:0.3,carbs_g:28 }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "quinoa (cooked)",          per100: { kcal:120, protein_g:4.4,fat_g:1.9,carbs_g:21 }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "sweet potato (baked)",     per100: { kcal:90,  protein_g:2,  fat_g:0.1,carbs_g:21 }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "corn tortilla",            per100: { kcal:218, protein_g:5.7,fat_g:2.9,carbs_g:44 }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "whole wheat bread",        per100: { kcal:247, protein_g:13, fat_g:4.2,carbs_g:41 }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "oats (dry)",               per100: { kcal:389, protein_g:16.9,fat_g:6.9,carbs_g:66.3}, dietTags:["omnivore","vegetarian","vegan"] },

  { name: "broccoli (cooked)",        per100: { kcal:35,  protein_g:2.4,fat_g:0.4,carbs_g:7.2}, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "spinach (raw)",            per100: { kcal:23,  protein_g:2.9,fat_g:0.4,carbs_g:3.6}, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "apple",                    per100: { kcal:52,  protein_g:0.3,fat_g:0.2,carbs_g:14 }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "banana",                   per100: { kcal:89,  protein_g:1.1,fat_g:0.3,carbs_g:23 }, dietTags:["omnivore","vegetarian","vegan"] },

  { name: "avocado",                  per100: { kcal:160, protein_g:2,  fat_g:15, carbs_g:9  }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "olive oil",                per100: { kcal:884, protein_g:0,  fat_g:100,carbs_g:0  }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "almonds",                  per100: { kcal:579, protein_g:21, fat_g:50, carbs_g:22 }, dietTags:["omnivore","vegetarian","vegan"] },
  { name: "peanut butter",            per100: { kcal:588, protein_g:25, fat_g:50, carbs_g:20 }, dietTags:["omnivore","vegetarian","vegan"], allergens:["peanut"] }
];

// helpers
export function nutrientsFor(food: Food, grams: number): Nutrients {
  const f = grams / 100;
  return {
    kcal: round1(food.per100.kcal * f),
    protein_g: round1(food.per100.protein_g * f),
    fat_g: round1(food.per100.fat_g * f),
    carbs_g: round1(food.per100.carbs_g * f)
  };
}
export function searchFoods(q: string) {
  const s = q.trim().toLowerCase();
  return FOODS.filter(f => f.name.toLowerCase().includes(s));
}
export function byDiet(diet: "omnivore"|"vegetarian"|"vegan") {
  return FOODS.filter(f => f.dietTags.includes(diet));
}
export function excludeAllergens(list: Food[], allergiesCsv: string | undefined) {
  if (!allergiesCsv) return list;
  const bad = allergiesCsv.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!bad.length) return list;
  return list.filter(f => !f.allergens || !f.allergens.some(a => bad.includes(a.toLowerCase())));
}
export function roundTo(x: number, step = 5) { return Math.max(0, Math.round(x / step) * step); }
export function round1(x: number) { return Math.round(x * 10) / 10; }
