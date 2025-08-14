export type Activity = "Low" | "Moderate" | "High";
export type Goal = "Fat loss" | "Maintenance" | "Muscle gain" | "Recomposition";
export type Sex = "M" | "F" | "X";

export function computeTargets(
  sex: Sex,
  age: number,
  height_cm: number,
  weight_kg: number,
  activity: Activity,
  goal: Goal
) {
  // Mifflin–St Jeor BMR
  let bmr: number;
  if (sex === "M") bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  else if (sex === "F") bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  else bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 78;

  const af = { Low: 1.2, Moderate: 1.5, High: 1.75 }[activity];
  const adj = { "Fat loss": -400, Maintenance: 0, "Muscle gain": 300, Recomposition: 0 }[goal];

  const kcal = Math.max(1200, Math.round(bmr * af + adj));
  const protein_g = Math.round(2.0 * weight_kg);
  const fat_g = Math.round(0.9 * weight_kg);
  const carbs_g = Math.round(Math.max(0, (kcal - protein_g * 4 - fat_g * 9) / 4));

  return { kcal, protein_g, fat_g, carbs_g };
}
