import { format } from "date-fns";
import type { LiftSet, Unit } from "./store";

export const LB_PER_KG = 2.2046226218;

export const STEPS: Record<Unit, readonly [number, number, number]> = {
  kg: [1.25, 2.5, 5],
  lb: [2.5, 5, 10],
};

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function kgToUnit(kg: number, unit: Unit): number {
  return unit === "kg" ? kg : kg * LB_PER_KG;
}

export function unitToKg(value: number, unit: Unit): number {
  return unit === "kg" ? value : value / LB_PER_KG;
}

export function weightCap(unit: Unit): number {
  return unit === "kg" ? 500 : 1100;
}

export function displayWeight(kg: number, unit: Unit): number {
  if (kg <= 0) return 0;
  const value = kgToUnit(kg, unit);
  return unit === "lb" ? Math.round(value * 10) / 10 : round2(value);
}

export function formatAmount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(round2(n));
}

export function formatWeight(value: number, unit: Unit): string {
  if (value <= 0) return "BW";
  return `${formatAmount(value)} ${unit}`;
}

export function dayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftDay(day: string, delta: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(year, (month || 1) - 1, date || 1);
  next.setDate(next.getDate() + delta);
  return dayKey(next);
}

export function setDay(set: { performedOn?: string; at: number }): string {
  if (set.performedOn && /^\d{4}-\d{2}-\d{2}$/.test(set.performedOn)) return set.performedOn;
  return dayKey(new Date(set.at));
}

export function calendarLabel(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return format(new Date(year, (month || 1) - 1, date || 1), "d MMM yyyy");
}

export function headingForDay(day: string, today = dayKey()): string {
  if (day === today) return "Today";
  if (day === shiftDay(today, -1)) return "Yesterday";
  const [year, month, date] = day.split("-").map(Number);
  return format(new Date(year, month - 1, date), "EEE d MMM");
}

export function clockLabel(ts: number): string {
  return format(ts, "h:mm a");
}

export function sessionVolume(sets: LiftSet[], unit: Unit): number {
  const total = sets.reduce((sum, set) => sum + kgToUnit(set.weightKg, unit) * set.reps, 0);
  return Math.round(total);
}

export type LastLift = {
  when: "previous" | "same-day";
  day: string;
  weight: number;
  reps: number;
};

function heaviest(list: LiftSet[]): LiftSet | undefined {
  let best: LiftSet | undefined;
  for (const set of list) {
    if (!best || set.weightKg > best.weightKg || (set.weightKg === best.weightKg && set.reps > best.reps)) {
      best = set;
    }
  }
  return best;
}

export function lastLift(sets: LiftSet[], exerciseId: string, unit: Unit, day: string): LastLift | null {
  const mine = sets.filter((set) => set.exerciseId === exerciseId);
  if (mine.length === 0) return null;
  const earlier = mine.filter((set) => setDay(set) < day);
  const pool = earlier.length > 0 ? earlier : mine.filter((set) => setDay(set) === day);
  if (pool.length === 0) return null;
  let latestDay = "";
  for (const set of pool) {
    const logged = setDay(set);
    if (logged > latestDay) latestDay = logged;
  }
  const best = heaviest(pool.filter((set) => setDay(set) === latestDay));
  if (!best) return null;
  return {
    when: earlier.length > 0 ? "previous" : "same-day",
    day: latestDay,
    weight: displayWeight(best.weightKg, unit),
    reps: best.reps,
  };
}

export function fallbackWeight(unit: Unit): number {
  return unit === "kg" ? 20 : 45;
}
