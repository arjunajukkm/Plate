import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-BVWhH_-T.mjs";
import { t as authMiddleware } from "./middleware-B6fhtFTv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-Dhc7LmIy.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var DAY = /^\d{4}-\d{2}-\d{2}$/;
function cleanName(name) {
	return name.trim().replace(/\s+/g, " ").slice(0, 40);
}
function cleanId(id) {
	const value = id.trim();
	if (value.length < 1 || value.length > 80) throw new Error("Invalid id");
	return value;
}
function cleanDay(day) {
	if (!DAY.test(day)) throw new Error("Invalid date");
	return day;
}
var loadLog_createServerFn_handler = createServerRpc({
	id: "549b6628e743f04587ee750a0c0586190541ee5de418ce37696acf3969fa8b18",
	name: "loadLog",
	filename: "src/lib/gym/api.ts"
}, (opts) => loadLog.__executeServer(opts));
var loadLog = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(loadLog_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	return {
		exercises: await sql`
      select id, name from exercises
      where user_id = ${context.userId}
      order by created_at asc
    `,
		sets: (await sql`
      select id, exercise_id, weight_kg, reps, performed_on::text as performed_on,
        (extract(epoch from logged_at) * 1000)::bigint as at
      from sets
      where user_id = ${context.userId}
      order by performed_on asc, logged_at asc
    `).map((row) => ({
			id: row.id,
			exerciseId: row.exercise_id,
			weightKg: Number(row.weight_kg),
			reps: Number(row.reps),
			performedOn: row.performed_on,
			at: Number(row.at)
		}))
	};
});
var saveExercise_createServerFn_handler = createServerRpc({
	id: "413aa2485d2393f6738ff136d0a5a17d708c6efb2fba80a90da4dfc4b14339c9",
	name: "saveExercise",
	filename: "src/lib/gym/api.ts"
}, (opts) => saveExercise.__executeServer(opts));
var saveExercise = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({
	id: cleanId(input.id),
	name: cleanName(input.name)
})).handler(saveExercise_createServerFn_handler, async ({ context, data }) => {
	if (!data.name) return { ok: false };
	const sql = await getSql();
	const byId = await sql`
      select user_id from exercises where id = ${data.id} limit 1
    `;
	if (byId[0] && byId[0].user_id !== context.userId) return { ok: false };
	const existing = await sql`
      select id from exercises
      where user_id = ${context.userId} and lower(name) = lower(${data.name})
      limit 1
    `;
	if (existing[0] && existing[0].id !== data.id) return {
		ok: true,
		id: existing[0].id
	};
	await sql`
      insert into exercises (id, user_id, name)
      values (${data.id}, ${context.userId}, ${data.name})
      on conflict (id) do update set name = excluded.name
      where exercises.user_id = excluded.user_id
    `;
	return {
		ok: true,
		id: data.id
	};
});
var renameExercise_createServerFn_handler = createServerRpc({
	id: "3e63433d103ac4270224962b41cb2cbea4a42f9dcf0ebe4380ac4310b3c57337",
	name: "renameExercise",
	filename: "src/lib/gym/api.ts"
}, (opts) => renameExercise.__executeServer(opts));
var renameExercise = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({
	id: cleanId(input.id),
	name: cleanName(input.name)
})).handler(renameExercise_createServerFn_handler, async ({ context, data }) => {
	if (!data.name) return { ok: false };
	await (await getSql())`
      update exercises set name = ${data.name}
      where id = ${data.id} and user_id = ${context.userId}
    `;
	return { ok: true };
});
var deleteExercise_createServerFn_handler = createServerRpc({
	id: "fc1a5e9e9dd6ec53d901c722dd5414bf9097ec702f0de81683eb6a39cecca4df",
	name: "deleteExercise",
	filename: "src/lib/gym/api.ts"
}, (opts) => deleteExercise.__executeServer(opts));
var deleteExercise = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => cleanId(id)).handler(deleteExercise_createServerFn_handler, async ({ context, data: id }) => {
	const sql = await getSql();
	if ((await sql`
      select id from sets where user_id = ${context.userId} and exercise_id = ${id} limit 1
    `)[0]) return { ok: false };
	await sql`delete from exercises where id = ${id} and user_id = ${context.userId}`;
	return { ok: true };
});
function cleanSet(input) {
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
		at: Number.isFinite(input.at) ? input.at : Date.now()
	};
}
var saveSet_createServerFn_handler = createServerRpc({
	id: "6418ef44bfa5c6821a5e03dae1b1baa4773c8087ae5f3acdfbc2e0ffbddf9902",
	name: "saveSet",
	filename: "src/lib/gym/api.ts"
}, (opts) => saveSet.__executeServer(opts));
var saveSet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => cleanSet(input)).handler(saveSet_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const byId = await sql`
      select user_id from sets where id = ${data.id} limit 1
    `;
	if (byId[0] && byId[0].user_id !== context.userId) return { ok: false };
	if (!(await sql`
      select id from exercises where id = ${data.exerciseId} and user_id = ${context.userId} limit 1
    `)[0]) return { ok: false };
	await sql`
      insert into sets (id, user_id, exercise_id, weight_kg, reps, performed_on, logged_at)
      values (
        ${data.id},
        ${context.userId},
        ${data.exerciseId},
        ${data.weightKg},
        ${data.reps},
        ${data.performedOn},
        to_timestamp(${data.at / 1e3})
      )
      on conflict (id) do update set
        weight_kg = excluded.weight_kg,
        reps = excluded.reps,
        performed_on = excluded.performed_on
      where sets.user_id = excluded.user_id
    `;
	return { ok: true };
});
var removeSet_createServerFn_handler = createServerRpc({
	id: "263a716a9233bfc20bf42a9f6068207aedc29101ab729daa8a96f426a720be6c",
	name: "removeSet",
	filename: "src/lib/gym/api.ts"
}, (opts) => removeSet.__executeServer(opts));
var removeSet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => cleanId(id)).handler(removeSet_createServerFn_handler, async ({ context, data: id }) => {
	await (await getSql())`delete from sets where id = ${id} and user_id = ${context.userId}`;
	return { ok: true };
});
//#endregion
export { deleteExercise_createServerFn_handler, loadLog_createServerFn_handler, removeSet_createServerFn_handler, renameExercise_createServerFn_handler, saveExercise_createServerFn_handler, saveSet_createServerFn_handler };
