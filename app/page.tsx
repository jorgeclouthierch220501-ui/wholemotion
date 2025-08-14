"use client";

import { computeTargets, Activity, Goal, Sex } from "../lib/targets";
import { FOODS, nutrientsFor, searchFoods, byDiet, excludeAllergens, roundTo, round1, Food } from "../lib/fooddb";

import { FOODS, nutrientsFor, searchFoods, byDiet, excludeAllergens, roundTo, round1, Food } from "@/lib/fooddb";

const label = { marginBottom: 6, display: "block", fontSize: 12, opacity: 0.85 };
const input = { padding: "10px 12px", borderRadius: 10, border: "1px solid #2b2b2f", background: "#141418", color: "#fff", width: "100%" } as const;
const card: React.CSSProperties = { background: "#111114", border: "1px solid #2b2b2f", padding: 16, borderRadius: 14 };
const btn = { ...input, cursor: "pointer", fontWeight: 600 } as const;

type LogItem = { id: string; date: string; food: string; grams: number; kcal: number; protein_g: number; fat_g: number; carbs_g: number };
type DietPlan = { meals: { name: string; items: { food: string; grams: number; kcal: number; protein_g: number; fat_g: number; carbs_g: number }[]; totals: any }[]; dayTotals: any; notes: string[] };
type WorkoutPlan = { days: { day: string; sessions: { type: "fuerza"|"cardio"; muscle_group?: string; exercises?: { name: string; sets: number; reps: string; rest_sec: number }[]; duration_min?: number; intensity?: string }[] }[]; general_tips: string[] };

type SimplifiedFood = { name: string; per100: { kcal: number; protein_g: number; fat_g: number; carbs_g: number } };

const todayISO = () => new Date().toISOString().slice(0,10);
const storageKey = "calorieLog_v1";

function sumNutrients(items: { kcal: number; protein_g: number; fat_g: number; carbs_g: number }[]) {
  return items.reduce((acc, it) => ({
    kcal: round1(acc.kcal + it.kcal),
    protein_g: round1(acc.protein_g + it.protein_g),
    fat_g: round1(acc.fat_g + it.fat_g),
    carbs_g: round1(acc.carbs_g + it.carbs_g)
  }), { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
}

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * Math.max(1, arr.length))] }

function generateDietPlan(opts: {
  sex: Sex; age: number; height_cm: number; weight_kg: number;
  activity: Activity; goal: Goal; diet: "omnivore"|"vegetarian"|"vegan";
  allergies?: string; preferences?: string;
}): DietPlan {
  const targets = computeTargets(opts.sex, opts.age, opts.height_cm, opts.weight_kg, opts.activity, opts.goal);

  const shares = [
    { name: "Breakfast", share: 0.25 },
    { name: "Lunch", share: 0.35 },
    { name: "Dinner", share: 0.30 },
    { name: "Snack", share: 0.10 }
  ];

  const pool = excludeAllergens(byDiet(opts.diet), opts.allergies);
  const proteins = pool.filter(f => f.per100.protein_g >= 8);
  const carbs    = pool.filter(f => f.per100.carbs_g >= 15);
  const fats     = pool.filter(f => f.per100.fat_g >= 15);
  const vegFruit = pool.filter(f => ["broccoli","spinach","apple","banana"].some(k => f.name.toLowerCase().includes(k)));

  const meals = shares.map(m => {
    const kcalT = targets.kcal * m.share;
    const pT = targets.protein_g * m.share;
    const fT = targets.fat_g * m.share;
    const cT = targets.carbs_g * m.share;

    const P = pick(proteins.length ? proteins : pool);
    const C = pick(carbs.length ? carbs : pool);
    const F = pick(fats.length ? fats : pool);
    const V = pick(vegFruit.length ? vegFruit : pool);

    const gramsP = roundTo((pT / (P.per100.protein_g / 100)) || 0, 5);
    const nutP = nutrientsFor(P, gramsP);

    let kcalRem = Math.max(0, kcalT - nutP.kcal);
    const gramsC = roundTo((((kcalRem * 0.75) / 4) / (C.per100.carbs_g / 100)) || 0, 5);
    const gramsF = roundTo((((kcalRem * 0.25) / 9) / (F.per100.fat_g / 100)) || 0, 5);
    const gramsV = kcalT > 350 ? 100 : 50;

    const nutC = nutrientsFor(C, gramsC);
    const nutF = nutrientsFor(F, gramsF);
    const nutV = nutrientsFor(V, gramsV);

    const items = [
      { food: P.name, grams: gramsP, ...nutP },
      { food: C.name, grams: gramsC, ...nutC },
      { food: F.name, grams: gramsF, ...nutF },
      { food: V.name, grams: gramsV, ...nutV }
    ].filter(x => x.grams > 0);

    const totals = sumNutrients(items);
    return { name: m.name, items, totals };
  });

  const dayTotals = sumNutrients(meals.flatMap(m => m.items));
  const notes = [
    "Adjust portions ±10% based on hunger and energy.",
    "Hydration: 2–3 L/day; add veggies if fiber is low."
  ];
  return { meals, dayTotals, notes };
}

function generateWorkoutPlan(opts: { goal: Goal; daysPerWeek?: number; }): { days: any[]; general_tips: string[] } {
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const wantDays = opts.daysPerWeek ?? 5;
  const selected = days.slice(0, wantDays);

  const strengthTemplates = [
    { muscle_group: "upper body",  ex: [["Bench press","4x6-8"],["Row","4x8-10"],["Shoulder press","3x8-10"],["Lat pulldown","3x10-12"],["Triceps dips","3x10-12"]] },
    { muscle_group: "lower body",  ex: [["Back squat","4x5-8"],["Romanian deadlift","4x6-8"],["Lunge","3x10-12"],["Leg curl","3x10-12"],["Calf raise","3x12-15"]] },
    { muscle_group: "full body",   ex: [["Deadlift","3x3-5"],["Incline press","3x6-8"],["Pull-up","3xAMRAP"],["Split squat","3x8-10"],["Plank","3x60s"]] },
    { muscle_group: "push",         ex: [["Bench press","4x6-8"],["Overhead press","3x6-8"],["Incline DB press","3x8-10"],["Cable fly","3x12-15"],["Triceps rope","3x12-15"]] },
    { muscle_group: "pull",         ex: [["Barbell row","4x6-8"],["Lat pulldown","3x8-10"],["Seated row","3x10-12"],["Face pull","3x12-15"],["Biceps curl","3x10-12"]] },
    { muscle_group: "legs",         ex: [["Front squat","4x6-8"],["RDL","4x6-8"],["Leg press","3x10-12"],["Leg extension","3x12-15"],["Calf raise","3x12-15"]] }
  ];

  const cardioBlock = (mins: number, intensity: string) => ({ type: "cardio" as const, duration_min: mins, intensity });
  const strengthBlock = (t: any) => ({
    type: "fuerza" as const,
    muscle_group: t.muscle_group,
    exercises: t.ex.map((pair: [string, string]) => ({ name: pair[0], sets: parseInt(pair[1].split("x")[0]) || 3, reps: pair[1], rest_sec: 90 }))
  });

  const planDays = selected.map((day, i) => {
    const t = strengthTemplates[i % strengthTemplates.length];
    const sessions: any[] = [strengthBlock(t)];

    if (opts.goal === "Fat loss") sessions.push(cardioBlock(25, "Z2/Z3"));
    if (opts.goal === "Maintenance") sessions.push(cardioBlock(15, "Z2"));
    if (opts.goal === "Muscle gain") sessions.push(cardioBlock(10, "Z1-Z2"));
    if (opts.goal === "Recomposition") sessions.push(cardioBlock(20, "Z2"));

    return { day, sessions };
  });

  const tips = [
    "Warm-up 8–10 min + mobility before lifting.",
    "Progressive overload: +2.5–5% when sets feel easy.",
    "Sleep 7–9 h; protein ~2 g/kg BW."
  ];
  return { days: planDays, general_tips: tips };
}

function useCalorieLog(date: string) {
  const [items, setItems] = useState<LogItem[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    const all: LogItem[] = raw ? JSON.parse(raw) : [];
    setItems(all.filter(x => x.date === date));
  }, [date]);

  function persist(next: LogItem[]) {
    const raw = localStorage.getItem(storageKey);
    const all: LogItem[] = raw ? JSON.parse(raw) : [];
    const others = all.filter(x => x.date !== date);
    const newAll = [...others, ...next];
    localStorage.setItem(storageKey, JSON.stringify(newAll));
    setItems(next);
  }

  function addFromPer100(name: string, per100: { kcal: number; protein_g: number; fat_g: number; carbs_g: number }, grams: number) {
    const f = grams / 100;
    const id = crypto.randomUUID();
    persist([...items, {
      id, date, food: name, grams,
      kcal: round1(per100.kcal * f),
      protein_g: round1(per100.protein_g * f),
      fat_g: round1(per100.fat_g * f),
      carbs_g: round1(per100.carbs_g * f)
    }]);
  }

  function add(food: Food, grams: number) {
    const n = nutrientsFor(food, grams);
    const id = crypto.randomUUID();
    persist([...items, { id, date, food: food.name, grams, ...n }]);
  }
  function remove(id: string) { persist(items.filter(x => x.id !== id)); }

  return { items, add, addFromPer100, remove };
}

export default function Page() {
  const [sex, setSex] = useState<Sex>("M");
  const [age, setAge] = useState(24);
  const [height, setHeight] = useState(176);
  const [weight, setWeight] = useState(75);
  const [activity, setActivity] = useState<Activity>("Moderate");
  const [goal, setGoal] = useState<Goal>("Recomposition");
  const [diet, setDiet] = useState<"omnivore"|"vegetarian"|"vegan">("omnivore");
  const [allergies, setAllergies] = useState("");
  const [preferences, setPreferences] = useState("");

  const targets = useMemo(() => computeTargets(sex, age, height, weight, activity, goal), [sex, age, height, weight, activity, goal]);
  const [tab, setTab] = useState<"log"|"diet"|"workout">("log");

  const [date, setDate] = useState(todayISO());
  const { items, add, addFromPer100, remove } = useCalorieLog(date);
  const totals = useMemo(() => sumNutrients(items), [items]);

  const [foodQuery, setFoodQuery] = useState("");
  const [grams, setGrams] = useState(100);

  const [results, setResults] = useState<SimplifiedFood[]>([]);
  const [status, setStatus] = useState<"idle"|"usda"|"fallback">("idle");

  useEffect(() => {
    const q = foodQuery.trim();
    if (q.length < 2) { setResults([]); setStatus("idle"); return; }

    const ctl = new AbortController();
    (async () => {
      try {
        setStatus("usda");
        const r = await fetch(`/api/usda/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        const foods: SimplifiedFood[] = data?.foods ?? [];
        if (foods.length) {
          setResults(foods);
          setStatus("usda");
        } else {
          setResults(searchFoods(q).map(f => ({ name: f.name, per100: f.per100 })));
          setStatus("fallback");
        }
      } catch {
        setResults(searchFoods(q).map(f => ({ name: f.name, per100: f.per100 })));
        setStatus("fallback");
      }
    })();
    return () => ctl.abort();
  }, [foodQuery]);

  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  function onGenerateDiet() {
    const plan = generateDietPlan({ sex, age, height_cm: height, weight_kg: weight, activity, goal, diet, allergies, preferences });
    setDietPlan(plan);
  }

  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  function onGenerateWorkout() { setWorkoutPlan(generateWorkoutPlan({ goal, daysPerWeek: 5 }) as any); }

  const wrap = { maxWidth: 1000, margin: "36px auto", padding: "0 18px" };

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Fitness MVP (No AI) — with USDA calories</h1>
      <p style={{ marginTop: 0, opacity: 0.82 }}>Tabs: Calorie log • Diet plan • Workout plan</p>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => setTab("log")} style={tabBtn(tab==="log")}>Calorie log</button>
        <button onClick={() => setTab("diet")} style={tabBtn(tab==="diet")}>Diet plan</button>
        <button onClick={() => setTab("workout")} style={tabBtn(tab==="workout")}>Workout plan</button>
      </div>

      <section style={{ ...card, marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 12 }}>
          <div><label style={label}>Sex</label>
            <select value={sex} onChange={e => setSex(e.target.value as Sex)} style={input}><option>M</option><option>F</option><option>X</option></select>
          </div>
          <div><label style={label}>Age</label>
            <input type="number" value={age} onChange={e => setAge(+e.target.value)} style={input} />
          </div>
          <div><label style={label}>Height (cm)</label>
            <input type="number" value={height} onChange={e => setHeight(+e.target.value)} style={input} />
          </div>
          <div><label style={label}>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(+e.target.value)} style={input} />
          </div>
          <div><label style={label}>Activity</label>
            <select value={activity} onChange={e => setActivity(e.target.value as Activity)} style={input}>
              <option>Low</option><option>Moderate</option><option>High</option>
            </select>
          </div>
          <div><label style={label}>Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value as Goal)} style={input}>
              <option>Fat loss</option><option>Maintenance</option><option>Muscle gain</option><option>Recomposition</option>
            </select>
          </div>
        </div>
      </section>

      {tab === "log" && (
        <section style={{ ...card, marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Calorie log</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
            <div><label style={label}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} />
            </div>
            <div style={{ gridColumn: "span 2" }}><label style={label}>Search food</label>
              <input value={foodQuery} onChange={e => setFoodQuery(e.target.value)} style={input} placeholder="e.g. apple, rice, chicken..." />
            </div>
            <div><label style={label}>Grams</label>
              <input type="number" value={grams} onChange={e => setGrams(+e.target.value)} style={input} />
            </div>
          </div>

          <small style={{ display: "block", marginTop: 8, opacity: 0.7 }}>
            Source: {status === "usda" ? "USDA FoodData Central" : status === "fallback" ? "Local catalog (fallback)" : "Type 2+ letters to search"}
          </small>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
            {results.map((f, i) => (
              <div key={i} style={{ ...card, padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{f.name}</div>
                <div style={{ opacity: 0.8, fontSize: 12, margin: "6px 0" }}>
                  per 100g — kcal {f.per100.kcal}, P {f.per100.protein_g}g, F {f.per100.fat_g}g, C {f.per100.carbs_g}g
                </div>
                <button style={btn} onClick={() => addFromPer100(f.name, f.per100, grams)}>Add {grams} g</button>
              </div>
            ))}
          </div>

          <hr style={{ borderColor: "#222", margin: "18px 0" }} />

          <h4 style={{ marginTop: 0 }}>Today’s items</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", opacity: 0.8 }}>
                  <th>Food</th><th>Grams</th><th>Kcal</th><th>P</th><th>F</th><th>C</th><th></th>
                </tr>
              </thead>
              <tbody>
              {items.map(it => (
                <tr key={it.id} style={{ borderTop: "1px solid #222" }}>
                  <td>{it.food}</td><td>{it.grams}</td>
                  <td>{it.kcal}</td><td>{it.protein_g}</td><td>{it.fat_g}</td><td>{it.carbs_g}</td>
                  <td><button style={{ ...btn, padding: "6px 10px" }} onClick={() => remove(it.id)}>Remove</button></td>
                </tr>
              ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #333" }}>
                  <td><b>Totals</b></td><td></td>
                  <td><b>{totals.kcal}</b></td>
                  <td><b>{totals.protein_g}</b></td>
                  <td><b>{totals.fat_g}</b></td>
                  <td><b>{totals.carbs_g}</b></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {tab === "diet" && (
        <section style={{ ...card, marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Diet plan (rule-based)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
            <div><label style={label}>Diet</label>
              <select value={diet} onChange={e => setDiet(e.target.value as any)} style={input}>
                <option>omnivore</option><option>vegetarian</option><option>vegan</option>
              </select>
            </div>
            <div><label style={label}>Allergies</label>
              <input value={allergies} onChange={e => setAllergies(e.target.value)} style={input} placeholder="peanut, ..." />
            </div>
            <div><label style={label}>Preferences</label>
              <input value={preferences} onChange={e => setPreferences(e.target.value)} style={input} placeholder="high protein, ..." />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={onGenerateDiet} style={btn}>Generate diet</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <small style={{ opacity: 0.8 }}>Targets:</small>
            <pre style={{ ...card, whiteSpace: "pre-wrap" }}>{JSON.stringify(targets, null, 2)}</pre>
          </div>

          {dietPlan && (
            <div style={{ marginTop: 12 }}>
              <pre style={{ ...card, whiteSpace: "pre-wrap" }}>{JSON.stringify(dietPlan, null, 2)}</pre>
            </div>
          )}
        </section>
      )}

      {tab === "workout" && (
        <section style={{ ...card, marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Workout plan (rule-based)</h3>
          <button onClick={onGenerateWorkout} style={btn}>Generate workout</button>
          {workoutPlan && (
            <div style={{ marginTop: 12 }}>
              <pre style={{ ...card, whiteSpace: "pre-wrap" }}>{JSON.stringify(workoutPlan, null, 2)}</pre>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function tabBtn(active: boolean): React.CSSProperties {
  return { ...btn, background: active ? "#1d1d22" : "#141418", borderColor: active ? "#3a3a44" : "#2b2b2f" };
}
