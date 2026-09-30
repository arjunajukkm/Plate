import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type ExerciseRow = { id: string; name: string };
export type SetRow = {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  performedOn: string;
  at: number;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 40);
}

function cleanId(id: string): string {
  const value = id.trim();
  if (value.length < 1 || value.length > 80) throw new Error("Invalid id");
  return value;
}

function cleanDay(day: string): string {
  if (!DAY.test(day)) throw new Error("Invalid date");
  return day;
}

export const loadLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const exercises = await sql<{ id: string; name: string }>`
      select id, name from exercises
      where user_id = ${context.userId}
      order by created_at asc
    `;
    const sets = await sql<{
      id: string;
      exercise_id: string;
      weight_kg: number;
      reps: number;
      performed_on: string;
      at: number;
    }>`
      select id, exercise_id, weight_kg, reps, performed_on::text as performed_on,
        (extract(epoch from logged_at) * 1000)::bigint as at
      from sets
      where user_id = ${context.userId}
      order by performed_on asc, logged_at asc
    `;
    return {
      exercises,
      sets: sets.map((row) => ({
        id: row.id,
        exerciseId: row.exercise_id,
        weightKg: Number(row.weight_kg),
        reps: Number(row.reps),
        performedOn: row.performed_on,
        at: Number(row.at),
      })),
    };
  });

export const saveExercise = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; name: string }) => ({
    id: cleanId(input.id),
    name: cleanName(input.name),
  }))
  .handler(async ({ context, data }) => {
    if (!data.name) return { ok: false as const };
    const sql = await getSql();
    const byId = await sql<{ user_id: string }>`
      select user_id from exercises where id = ${data.id} limit 1
    `;
    if (byId[0] && byId[0].user_id !== context.userId) return { ok: false as const };
    const existing = await sql<{ id: string }>`
      select id from exercises
      where user_id = ${context.userId} and lower(name) = lower(${data.name})
      limit 1
    `;
    if (existing[0] && existing[0].id !== data.id) return { ok: true as const, id: existing[0].id };
    await sql`
      insert into exercises (id, user_id, name)
      values (${data.id}, ${context.userId}, ${data.name})
      on conflict (id) do update set name = excluded.name
      where exercises.user_id = excluded.user_id
    `;
    return { ok: true as const, id: data.id };
  });

export const renameExercise = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; name: string }) => ({
    id: cleanId(input.id),
    name: cleanName(input.name),
  }))
  .handler(async ({ context, data }) => {
    if (!data.name) return { ok: false as const };
    const sql = await getSql();
    await sql`
      update exercises set name = ${data.name}
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const deleteExercise = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => cleanId(id))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const used = await sql<{ id: string }>`
      select id from sets where user_id = ${context.userId} and exercise_id = ${id} limit 1
    `;
    if (used[0]) return { ok: false as const };
    await sql`delete from exercises where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

function cleanSet(input: SetRow): SetRow {
  const reps = Math.round(Number(input.reps));
  const weightKg = Number(input.weightKg);
  if (!Number.isFinite(reps) || reps < 1 || reps > 999) throw new Error("Invalid reps");
  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 500) throw new Error("Invalid weight");
  return {
    id: cleanId(input.id),
    exerciseId: cleanId(input.exerciseId),
    weightKg,
    reps,
    performedOn: cleanDay(input.performedOn),
    at: Number.isFinite(input.at) ? input.at : Date.now(),
  };
}

export const saveSet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: SetRow) => cleanSet(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const byId = await sql<{ user_id: string }>`
      select user_id from sets where id = ${data.id} limit 1
    `;
    if (byId[0] && byId[0].user_id !== context.userId) return { ok: false as const };
    const owned = await sql<{ id: string }>`
      select id from exercises where id = ${data.exerciseId} and user_id = ${context.userId} limit 1
    `;
    if (!owned[0]) return { ok: false as const };
    await sql`
      insert into sets (id, user_id, exercise_id, weight_kg, reps, performed_on, logged_at)
      values (
        ${data.id},
        ${context.userId},
        ${data.exerciseId},
        ${data.weightKg},
        ${data.reps},
        ${data.performedOn},
        to_timestamp(${data.at / 1000})
      )
      on conflict (id) do update set
        weight_kg = excluded.weight_kg,
        reps = excluded.reps,
        performed_on = excluded.performed_on
      where sets.user_id = excluded.user_id
    `;
    return { ok: true as const };
  });

export const removeSet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => cleanId(id))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from sets where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });
