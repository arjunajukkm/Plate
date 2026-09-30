import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-B6fhtFTv.mjs";
import { i as signOut } from "./client-1vAx-gM_.mjs";
import { i as useCurrentUserState, n as PlateMark, r as useCurrentUser, t as AuthScreen } from "./auth-screen-BKShcSaV.mjs";
import { i as hasGateSessionMarker } from "./server-DuMa5usW.mjs";
import { a as Pencil, c as Delete, d as ChevronDown, f as ChartColumn, i as Plus, l as ChevronRight, o as Minus, r as Trash2, s as History, t as X, u as ChevronLeft } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { n as differenceInCalendarDays, r as startOfWeek, t as format } from "../_libs/date-fns.mjs";
import { a as Line, c as ResponsiveContainer, i as XAxis, l as Tooltip, n as LineChart, o as CartesianGrid, r as YAxis, s as Bar, t as BarChart } from "../_libs/recharts+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-J98P9yv2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var LB_PER_KG = 2.2046226218;
var STEPS = {
	kg: [
		1.25,
		2.5,
		5
	],
	lb: [
		2.5,
		5,
		10
	]
};
function round2(n) {
	return Math.round(n * 100) / 100;
}
function round4(n) {
	return Math.round(n * 1e4) / 1e4;
}
function kgToUnit(kg, unit) {
	return unit === "kg" ? kg : kg * LB_PER_KG;
}
function unitToKg(value, unit) {
	return unit === "kg" ? value : value / LB_PER_KG;
}
function weightCap(unit) {
	return unit === "kg" ? 500 : 1100;
}
function displayWeight(kg, unit) {
	if (kg <= 0) return 0;
	const value = kgToUnit(kg, unit);
	return unit === "lb" ? Math.round(value * 10) / 10 : round2(value);
}
function formatAmount(n) {
	if (!Number.isFinite(n)) return "0";
	return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(round2(n));
}
function formatWeight(value, unit) {
	if (value <= 0) return "BW";
	return `${formatAmount(value)} ${unit}`;
}
function dayKey(date = /* @__PURE__ */ new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function shiftDay(day, delta) {
	const [year, month, date] = day.split("-").map(Number);
	const next = new Date(year, (month || 1) - 1, date || 1);
	next.setDate(next.getDate() + delta);
	return dayKey(next);
}
function setDay(set) {
	if (set.performedOn && /^\d{4}-\d{2}-\d{2}$/.test(set.performedOn)) return set.performedOn;
	return dayKey(new Date(set.at));
}
function calendarLabel(day) {
	const [year, month, date] = day.split("-").map(Number);
	return format(new Date(year, (month || 1) - 1, date || 1), "d MMM yyyy");
}
function headingForDay(day, today = dayKey()) {
	if (day === today) return "Today";
	if (day === shiftDay(today, -1)) return "Yesterday";
	const [year, month, date] = day.split("-").map(Number);
	return format(new Date(year, month - 1, date), "EEE d MMM");
}
function clockLabel(ts) {
	return format(ts, "h:mm a");
}
function sessionVolume(sets, unit) {
	const total = sets.reduce((sum, set) => sum + kgToUnit(set.weightKg, unit) * set.reps, 0);
	return Math.round(total);
}
function heaviest(list) {
	let best;
	for (const set of list) if (!best || set.weightKg > best.weightKg || set.weightKg === best.weightKg && set.reps > best.reps) best = set;
	return best;
}
function lastLift(sets, exerciseId, unit, day) {
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
		reps: best.reps
	};
}
function fallbackWeight(unit) {
	return unit === "kg" ? 20 : 45;
}
function localDay(day) {
	const [year, month, date] = day.split("-").map(Number);
	return new Date(year || 1970, (month || 1) - 1, date || 1);
}
function epley(kg, reps) {
	if (kg <= 0 || reps < 1) return 0;
	return kg * (1 + reps / 30);
}
function buildVolume(sets, unit, today) {
	const byDay = /* @__PURE__ */ new Map();
	for (const set of sets) {
		const day = setDay(set);
		const bucket = byDay.get(day);
		if (bucket) bucket.push(set);
		else byDay.set(day, [set]);
	}
	const days = [...byDay.keys()].sort();
	if (days.length === 0) return {
		title: "Volume",
		span: "",
		points: []
	};
	const first = days[0] ?? today;
	const last = days[days.length - 1] ?? today;
	const span = first === last ? first === today ? "Today" : calendarLabel(first) : `${calendarLabel(first)} – ${last === today ? "today" : calendarLabel(last)}`;
	const spanDays = Math.max(0, differenceInCalendarDays(localDay(last), localDay(first)));
	if (spanDays <= 28) {
		const points = [];
		for (let index = 0; index <= spanDays; index += 1) {
			const day = shiftDay(first, index);
			points.push({
				label: day === today ? "Today" : format(localDay(day), spanDays > 14 ? "d" : "d MMM"),
				volume: sessionVolume(byDay.get(day) ?? [], unit)
			});
		}
		return {
			title: "Daily volume",
			span,
			points
		};
	}
	const byWeek = /* @__PURE__ */ new Map();
	for (const [day, list] of byDay) {
		const key = format(startOfWeek(localDay(day), { weekStartsOn: 1 }), "yyyy-MM-dd");
		const bucket = byWeek.get(key);
		if (bucket) bucket.push(...list);
		else byWeek.set(key, [...list]);
	}
	const weekStarts = [...byWeek.keys()].sort();
	const points = [];
	let cursor = weekStarts[0] ?? first;
	const end = weekStarts[weekStarts.length - 1] ?? cursor;
	let guard = 0;
	while (cursor <= end && guard < 800) {
		points.push({
			label: format(localDay(cursor), "d MMM"),
			volume: sessionVolume(byWeek.get(cursor) ?? [], unit)
		});
		cursor = shiftDay(cursor, 7);
		guard += 1;
	}
	return {
		title: "Weekly volume",
		span,
		points
	};
}
function exerciseDays(sets, exerciseId, unit, today) {
	const byDay = /* @__PURE__ */ new Map();
	for (const set of sets) {
		if (set.exerciseId !== exerciseId) continue;
		const day = setDay(set);
		const bucket = byDay.get(day);
		if (bucket) bucket.push(set);
		else byDay.set(day, [set]);
	}
	return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, list]) => {
		let top = list[0];
		let estimate = list[0];
		for (const set of list) {
			if (!top || set.weightKg > top.weightKg || set.weightKg === top.weightKg && set.reps > top.reps) top = set;
			if (!estimate || epley(set.weightKg, set.reps) > epley(estimate.weightKg, estimate.reps)) estimate = set;
		}
		return {
			day,
			label: day === today ? "Today" : format(localDay(day), "d MMM"),
			top: top ? displayWeight(top.weightKg, unit) : 0,
			reps: top?.reps ?? 0,
			volume: sessionVolume(list, unit),
			e1rm: estimate ? displayWeight(epley(estimate.weightKg, estimate.reps), unit) : 0,
			estWeight: estimate ? displayWeight(estimate.weightKg, unit) : 0,
			estReps: estimate?.reps ?? 0
		};
	});
}
function progressCopy(points, unit) {
	if (points.length === 0) return null;
	const latest = points[points.length - 1];
	if (!latest) return null;
	const load = latest.top <= 0 ? "Bodyweight" : `${formatAmount(latest.top)} ${unit} × ${latest.reps}`;
	if (points.length === 1) return {
		headline: load,
		detail: "One session so far. Log it again and the line starts."
	};
	const first = points[0];
	const previous = points[points.length - 2];
	if (!first || !previous) return null;
	const since = round2(latest.top - first.top);
	const lastStep = round2(latest.top - previous.top);
	const heavier = points.every((point) => point.top <= latest.top) && lastStep > 0;
	let headline = "Same top weight";
	if (heavier && latest.top > 0) headline = `New top, ${formatAmount(latest.top)} ${unit}`;
	else if (since > 0) headline = `Up ${formatAmount(since)} ${unit}`;
	else if (since < 0) headline = `Down ${formatAmount(Math.abs(since))} ${unit}`;
	else if (latest.reps > first.reps) headline = `${latest.reps - first.reps} more reps`;
	let recent = "Last session matched the one before.";
	if (lastStep > 0) recent = `Last session was up ${formatAmount(lastStep)} ${unit}.`;
	else if (lastStep < 0) recent = `Last session dropped ${formatAmount(Math.abs(lastStep))} ${unit}.`;
	else if (latest.reps > previous.reps) recent = `Same weight, ${latest.reps - previous.reps} more reps.`;
	else if (latest.reps < previous.reps) recent = `Same weight, ${previous.reps - latest.reps} fewer reps.`;
	const lifted = latest.volume === previous.volume ? "" : ` That day moved ${formatAmount(latest.volume)} ${unit}, the one before ${formatAmount(previous.volume)} ${unit}.`;
	const from = first.top <= 0 ? "bodyweight" : `${formatAmount(first.top)} ${unit}`;
	return {
		headline,
		detail: `${recent}${lifted} Started at ${from} on ${calendarLabel(first.day)}.`
	};
}
function bestEstimate(points) {
	let best = null;
	for (const point of points) {
		if (point.e1rm <= 0) continue;
		if (!best || point.e1rm > best.e1rm) best = point;
	}
	return best;
}
function groupDays(sets) {
	const map = /* @__PURE__ */ new Map();
	for (const set of sets) {
		const day = setDay(set);
		const list = map.get(day);
		if (list) list.push(set);
		else map.set(day, [set]);
	}
	return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([day, list]) => {
		const ordered = [...list].sort((a, b) => a.at - b.at);
		const byExercise = /* @__PURE__ */ new Map();
		for (const set of ordered) {
			const bucket = byExercise.get(set.exerciseId);
			if (bucket) bucket.push(set);
			else byExercise.set(set.exerciseId, [set]);
		}
		return {
			day,
			exercises: [...byExercise.entries()]
		};
	});
}
function ChartTip({ active, payload, unit }) {
	const point = payload?.[0]?.payload;
	if (!active || !point) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-sm bg-surface-2 px-2.5 py-1.5 text-xs",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-subtle",
				children: point.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-medium nums",
				children: [
					point.top <= 0 ? "BW" : `${formatAmount(point.top)} ${unit}`,
					" × ",
					point.reps
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted nums",
				children: [
					formatAmount(point.volume),
					" ",
					unit,
					" lifted"
				]
			})
		]
	});
}
function Analytics({ sets, exercises, unit, focusId, onClose }) {
	const today = dayKey();
	const [selectedId, setSelectedId] = (0, import_react.useState)(focusId);
	const [mode, setMode] = (0, import_react.useState)("top");
	const [panel, setPanel] = (0, import_react.useState)("exercise");
	const [dayPick, setDayPick] = (0, import_react.useState)("");
	const chart = buildVolume(sets, unit, today);
	const sessionCount = new Set(sets.map((set) => setDay(set))).size;
	const names = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
	const best = /* @__PURE__ */ new Map();
	for (const set of sets) {
		const current = best.get(set.exerciseId);
		if (!current || set.weightKg > current.weightKg || set.weightKg === current.weightKg && set.reps > current.reps) best.set(set.exerciseId, set);
	}
	const records = [...best.values()].sort((a, b) => b.weightKg - a.weightKg).slice(0, 6);
	const focus = exercises.find((exercise) => exercise.id === selectedId) ?? exercises[0];
	const points = focus ? exerciseDays(sets, focus.id, unit, today) : [];
	const copy = progressCopy(points, unit);
	const estimate = bestEstimate(points);
	const weekStart = format(startOfWeek(localDay(today), { weekStartsOn: 1 }), "yyyy-MM-dd");
	const weekSets = sets.filter((set) => {
		const day = setDay(set);
		return day <= today && format(startOfWeek(localDay(day), { weekStartsOn: 1 }), "yyyy-MM-dd") === weekStart;
	});
	const weekSessions = new Set(weekSets.map((set) => setDay(set))).size;
	const lineKey = mode === "top" ? "top" : "volume";
	const showDots = points.length <= 16;
	const days = groupDays(sets);
	const visibleDays = dayPick ? days.filter((group) => group.day === dayPick) : days;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "app-wash fixed inset-0 z-20 flex justify-center text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-dvh w-full max-w-md flex-col pt-safe pb-safe",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-14 items-center gap-2 px-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm",
					onClick: onClose,
					"aria-label": "Back",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "size-5",
						strokeWidth: 1.75
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-medium tracking-tight",
					children: "Progress"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-4 pb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Volume",
								value: `${formatAmount(sessionVolume(sets, unit))} ${unit}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Sessions",
								value: String(sessionCount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Sets",
								value: String(sets.length)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						role: "group",
						"aria-label": "Progress view",
						children: [["exercise", "Exercise"], ["days", "Days"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": panel === value,
							className: clsx("focus-ring tap h-11 rounded-md text-sm font-medium", panel === value ? "bg-accent text-accent-fg" : "bg-surface text-muted"),
							onClick: () => setPanel(value),
							children: label
						}, value))
					}),
					panel === "exercise" && exercises.length > 0 && focus ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldSelect, {
							label: "Exercise",
							value: focus.id,
							onChange: setSelectedId,
							children: exercises.map((exercise) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: exercise.id,
								children: exercise.name
							}, exercise.id))
						}),
						copy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-md bg-accent-soft px-3 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base font-medium",
								children: copy.headline
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm leading-snug text-muted",
								children: copy.detail
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-subtle",
							children: "No sets for this exercise yet."
						}),
						points.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 flex gap-2",
								role: "group",
								"aria-label": "Chart",
								children: [["top", "Top weight"], ["lifted", "Weight lifted"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": mode === value,
									className: clsx("focus-ring tap h-10 rounded-full px-3 text-sm", mode === value ? "bg-accent text-accent-fg" : "bg-surface text-muted"),
									onClick: () => setMode(value),
									children: label
								}, value))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs text-subtle",
								children: mode === "top" ? "Heaviest weight each day you logged this exercise." : `Weight × reps each day, in ${unit}.`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 h-52 w-full min-w-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
									width: "100%",
									height: "100%",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
										data: points,
										margin: {
											top: 12,
											right: 8,
											left: 0,
											bottom: 0
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
												vertical: false,
												stroke: "var(--color-line)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
												dataKey: "label",
												tick: {
													fill: "var(--color-muted)",
													fontSize: 11
												},
												axisLine: false,
												tickLine: false,
												minTickGap: 18,
												interval: "preserveStartEnd"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
												width: 40,
												tick: {
													fill: "var(--color-muted)",
													fontSize: 11
												},
												axisLine: false,
												tickLine: false,
												domain: ([dataMin, dataMax]) => {
													if (mode === "lifted") return [0, dataMax <= 0 ? 1 : dataMax * 1.08];
													const pad = Math.max(2.5, (dataMax - dataMin) * .35);
													return [Math.max(0, dataMin - pad), dataMax + pad];
												},
												tickFormatter: (value) => formatAmount(value)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
												content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartTip, { unit }),
												cursor: { stroke: "var(--color-line)" }
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
												type: "linear",
												dataKey: lineKey,
												stroke: "var(--color-accent)",
												strokeWidth: 2.5,
												dot: showDots ? {
													r: 3,
													fill: "var(--color-accent)",
													strokeWidth: 0
												} : false,
												activeDot: { r: 5 },
												isAnimationActive: false
											})
										]
									})
								})
							}),
							estimate && estimate.e1rm > estimate.top ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm text-muted",
								children: [
									"Strength estimate",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-medium text-accent nums",
										children: [
											formatAmount(estimate.e1rm),
											" ",
											unit
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-subtle",
										children: [
											" ",
											"from ",
											estimate.estWeight <= 0 ? "BW" : formatAmount(estimate.estWeight),
											" × ",
											estimate.estReps
										]
									})
								]
							}) : null
						] }) : null,
						points.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2",
							children: [...points].reverse().map((point) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-baseline justify-between gap-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-muted",
									children: point.day === today ? "Today" : calendarLabel(point.day)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-right font-medium text-accent nums",
									children: [
										point.top <= 0 ? "BW" : formatWeight(point.top, unit),
										" × ",
										point.reps,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-normal text-subtle",
											children: [
												" · ",
												formatAmount(point.volume),
												" ",
												unit
											]
										})
									]
								})]
							}, point.day))
						}) : null
					] }) : null,
					panel === "days" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldSelect, {
						label: "Day",
						value: dayPick,
						onChange: setDayPick,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "All days"
						}), days.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: group.day,
							children: group.day === today ? "Today" : headingForDay(group.day, today)
						}, group.day))]
					}), visibleDays.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-subtle",
						children: "Log a few sets and this fills in."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 flex flex-col gap-3",
						children: visibleDays.map((group) => {
							const flat = group.exercises.flatMap(([, list]) => list);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-md bg-surface px-3 py-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-medium",
											children: group.day === today ? "Today" : headingForDay(group.day, today)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-accent nums",
											children: [
												flat.length,
												" ",
												flat.length === 1 ? "set" : "sets",
												" · ",
												formatAmount(sessionVolume(flat, unit)),
												" ",
												unit
											]
										})]
									}),
									group.day !== today ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-subtle",
										children: calendarLabel(group.day)
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-2",
										children: group.exercises.map(([exerciseId, list]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "border-t border-line py-2 first:border-t-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted",
												children: names.get(exerciseId) ?? "Exercise"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
												className: "mt-1",
												children: list.map((set) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "flex items-baseline justify-between gap-3 py-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs text-subtle nums",
														children: clockLabel(set.at)
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-medium nums",
														children: [
															set.weightKg <= 0 ? "BW" : formatWeight(displayWeight(set.weightKg, unit), unit),
															" ",
															"× ",
															set.reps
														]
													})]
												}, set.id))
											})]
										}, exerciseId))
									})
								]
							}, group.day);
						})
					})] }) : null,
					panel === "exercise" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-medium text-muted",
								children: chart.title
							}), chart.span ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-subtle",
								children: chart.span
							}) : null]
						}),
						weekSets.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-subtle",
							children: [
								"This week · ",
								weekSessions,
								" ",
								weekSessions === 1 ? "session" : "sessions",
								" · ",
								formatAmount(sessionVolume(weekSets, unit)),
								" ",
								unit
							]
						}) : null,
						chart.points.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-subtle",
							children: "Log a few sets and this fills in."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 h-40 w-full min-w-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
								width: "100%",
								height: "100%",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
									data: chart.points,
									margin: {
										top: 8,
										right: 0,
										left: 0,
										bottom: 0
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "label",
										tick: {
											fill: "var(--color-muted)",
											fontSize: 11
										},
										axisLine: false,
										tickLine: false,
										minTickGap: 18,
										interval: "preserveStartEnd"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "volume",
										fill: "var(--color-accent)",
										radius: [
											4,
											4,
											0,
											0
										],
										isAnimationActive: false
									})]
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-6 text-sm font-medium text-muted",
							children: "Heaviest sets"
						}),
						records.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-subtle",
							children: "Log a few sets and this fills in."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2",
							children: records.map((set) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-baseline justify-between gap-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 truncate",
									children: names.get(set.exerciseId) ?? "Exercise"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "shrink-0 font-medium text-accent nums",
									children: [
										formatWeight(displayWeight(set.weightKg, unit), unit),
										" × ",
										set.reps
									]
								})]
							}, set.exerciseId))
						})
					] }) : null
				]
			})]
		})
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-accent-soft px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm font-medium text-accent nums",
			children: value
		})]
	});
}
function FieldSelect({ label, value, onChange, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "mt-4 block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm font-medium text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "relative mt-2 block",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				value,
				onChange: (event) => onChange(event.target.value),
				className: "focus-ring h-12 w-full appearance-none rounded-md bg-surface px-3 pr-10 text-base text-fg",
				children
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-subtle" })]
		})]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var DAY = /^\d{4}-\d{2}-\d{2}$/;
function cleanName$1(name) {
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
var loadLog = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("549b6628e743f04587ee750a0c0586190541ee5de418ce37696acf3969fa8b18"));
var saveExercise = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({
	id: cleanId(input.id),
	name: cleanName$1(input.name)
})).handler(createSsrRpc("413aa2485d2393f6738ff136d0a5a17d708c6efb2fba80a90da4dfc4b14339c9"));
var renameExercise = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => ({
	id: cleanId(input.id),
	name: cleanName$1(input.name)
})).handler(createSsrRpc("3e63433d103ac4270224962b41cb2cbea4a42f9dcf0ebe4380ac4310b3c57337"));
var deleteExercise = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => cleanId(id)).handler(createSsrRpc("fc1a5e9e9dd6ec53d901c722dd5414bf9097ec702f0de81683eb6a39cecca4df"));
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
var saveSet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => cleanSet(input)).handler(createSsrRpc("6418ef44bfa5c6821a5e03dae1b1baa4773c8087ae5f3acdfbc2e0ffbddf9902"));
var removeSet = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => cleanId(id)).handler(createSsrRpc("263a716a9233bfc20bf42a9f6068207aedc29101ab729daa8a96f426a720be6c"));
var SUGGESTIONS = [
	"Bench Press",
	"Squat",
	"Deadlift",
	"Overhead Press",
	"Pull-up",
	"Lat Pulldown"
];
function readPrefs() {
	if (typeof localStorage === "undefined") return {
		unit: "kg",
		stepIndex: 1
	};
	try {
		const raw = localStorage.getItem("plate-prefs");
		if (!raw) return {
			unit: "kg",
			stepIndex: 1
		};
		const parsed = JSON.parse(raw);
		const stepIndex = parsed.stepIndex === 0 || parsed.stepIndex === 2 ? parsed.stepIndex : 1;
		return {
			unit: parsed.unit === "lb" ? "lb" : "kg",
			stepIndex
		};
	} catch {
		return {
			unit: "kg",
			stepIndex: 1
		};
	}
}
function writePrefs(prefs) {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem("plate-prefs", JSON.stringify(prefs));
}
function cleanName(name) {
	return name.trim().replace(/\s+/g, " ").slice(0, 40);
}
function dayFromAt(at) {
	const date = new Date(at);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}
async function pushLegacy() {
	if (typeof localStorage === "undefined") return;
	const raw = localStorage.getItem("plate-gym-v1");
	if (!raw) return;
	let legacy;
	try {
		legacy = JSON.parse(raw);
	} catch {
		return;
	}
	const exercises = legacy.state?.exercises ?? [];
	const sets = legacy.state?.sets ?? [];
	if (exercises.length === 0 && sets.length === 0) return;
	for (const exercise of exercises) {
		if (!exercise?.id || !exercise.name) continue;
		await saveExercise({ data: {
			id: exercise.id,
			name: exercise.name
		} });
	}
	for (const set of sets) {
		if (!set?.id || !set.exerciseId || !set.reps) continue;
		const at = typeof set.at === "number" ? set.at : Date.now();
		await saveSet({ data: {
			id: set.id,
			exerciseId: set.exerciseId,
			weightKg: Number(set.weightKg) || 0,
			reps: Number(set.reps),
			performedOn: set.performedOn || dayFromAt(at),
			at
		} });
	}
	localStorage.removeItem("plate-gym-v1");
}
var useGym = create()((set, get) => ({
	exercises: [],
	sets: [],
	unit: "kg",
	stepIndex: 1,
	activeExerciseId: "",
	hydrated: false,
	syncError: null,
	hydrateAccount: async () => {
		set({
			...readPrefs(),
			syncError: null
		});
		try {
			let data = await loadLog();
			if (data.exercises.length === 0 && data.sets.length === 0) {
				await pushLegacy();
				data = await loadLog();
			}
			const active = get().activeExerciseId;
			const activeExerciseId = data.exercises.some((item) => item.id === active) ? active : data.exercises[0]?.id ?? "";
			set({
				exercises: data.exercises,
				sets: data.sets,
				activeExerciseId,
				hydrated: true,
				syncError: null
			});
		} catch {
			set({
				hydrated: true,
				syncError: "Could not sync. Try again in a moment."
			});
		}
	},
	addSet: ({ exerciseId, weightKg, reps, performedOn, at }) => {
		const id = crypto.randomUUID();
		const entry = {
			id,
			exerciseId,
			weightKg,
			reps,
			performedOn,
			at: at ?? Date.now()
		};
		set({
			sets: [...get().sets, entry],
			syncError: null
		});
		saveSet({ data: entry }).then((result) => {
			if (!result.ok) throw new Error("rejected");
		}).catch(() => {
			set({
				sets: get().sets.filter((item) => item.id !== id),
				syncError: "That set did not sync."
			});
		});
		return id;
	},
	updateSet: (id, patch) => {
		const previous = get().sets;
		set({
			sets: previous.map((entry) => entry.id === id ? {
				...entry,
				...patch
			} : entry),
			syncError: null
		});
		const next = get().sets.find((entry) => entry.id === id);
		if (!next) return;
		saveSet({ data: next }).then((result) => {
			if (!result.ok) throw new Error("rejected");
		}).catch(() => set({
			sets: previous,
			syncError: "That edit did not sync."
		}));
	},
	deleteSet: (id) => {
		const previous = get().sets;
		set({
			sets: previous.filter((entry) => entry.id !== id),
			syncError: null
		});
		removeSet({ data: id }).then((result) => {
			if (!result.ok) throw new Error("rejected");
		}).catch(() => set({
			sets: previous,
			syncError: "Could not remove that set."
		}));
	},
	restoreSet: (entry) => {
		if (get().sets.some((item) => item.id === entry.id)) return;
		set({ sets: [...get().sets, entry].sort((a, b) => a.at - b.at) });
		saveSet({ data: entry }).then((result) => {
			if (!result.ok) throw new Error("rejected");
		}).catch(() => {
			set({
				sets: get().sets.filter((item) => item.id !== entry.id),
				syncError: "Could not restore that set."
			});
		});
	},
	addExercise: (name) => {
		const trimmed = cleanName(name);
		if (!trimmed) return null;
		const existing = get().exercises.find((exercise) => exercise.name.toLowerCase() === trimmed.toLowerCase());
		if (existing) {
			set({ activeExerciseId: existing.id });
			return existing.id;
		}
		const previousExercises = get().exercises;
		const previousActive = get().activeExerciseId;
		const id = crypto.randomUUID();
		set({
			exercises: [...previousExercises, {
				id,
				name: trimmed
			}],
			activeExerciseId: id,
			syncError: null
		});
		saveExercise({ data: {
			id,
			name: trimmed
		} }).then((result) => {
			if (!result.ok) throw new Error("rejected");
			if (result.id === id) return;
			set({
				exercises: get().exercises.some((item) => item.id === result.id) ? get().exercises.filter((item) => item.id !== id) : get().exercises.map((item) => item.id === id ? {
					id: result.id,
					name: trimmed
				} : item),
				activeExerciseId: get().activeExerciseId === id ? result.id : get().activeExerciseId
			});
		}).catch(() => {
			set({
				exercises: previousExercises,
				activeExerciseId: previousActive,
				syncError: "Could not save that exercise."
			});
		});
		return id;
	},
	renameExercise: (id, name) => {
		const trimmed = cleanName(name);
		if (!trimmed) return;
		const previous = get().exercises;
		const current = previous.find((exercise) => exercise.id === id);
		if (!current || current.name === trimmed) return;
		if (previous.some((exercise) => exercise.id !== id && exercise.name.toLowerCase() === trimmed.toLowerCase())) {
			set({ syncError: "You already have that exercise." });
			return;
		}
		set({
			exercises: previous.map((exercise) => exercise.id === id ? {
				...exercise,
				name: trimmed
			} : exercise),
			syncError: null
		});
		renameExercise({ data: {
			id,
			name: trimmed
		} }).then((result) => {
			if (!result.ok) throw new Error("rejected");
		}).catch(() => set({
			exercises: previous,
			syncError: "Could not rename that exercise."
		}));
	},
	removeExercise: (id) => {
		if (get().sets.some((entry) => entry.exerciseId === id)) return;
		const previous = get().exercises;
		const previousActive = get().activeExerciseId;
		const exercises = previous.filter((exercise) => exercise.id !== id);
		set({
			exercises,
			activeExerciseId: previousActive === id ? exercises[0]?.id ?? "" : previousActive,
			syncError: null
		});
		deleteExercise({ data: id }).then((result) => {
			if (!result.ok) throw new Error("rejected");
		}).catch(() => set({
			exercises: previous,
			activeExerciseId: previousActive,
			syncError: "Could not remove that exercise."
		}));
	},
	setUnit: (unit) => {
		set({ unit });
		writePrefs({
			unit,
			stepIndex: get().stepIndex
		});
	},
	setStepIndex: (stepIndex) => {
		set({ stepIndex });
		writePrefs({
			unit: get().unit,
			stepIndex
		});
	},
	setActiveExercise: (id) => set({ activeExerciseId: id }),
	setHydrated: (hydrated) => set({ hydrated })
}));
function planFromHistory(all, exerciseId) {
	const chronological = all.filter((set) => set.exerciseId === exerciseId).sort((a, b) => a.at - b.at);
	if (chronological.length === 0) return null;
	const burst = [];
	for (let index = chronological.length - 1; index >= 0; index -= 1) {
		const set = chronological[index];
		const next = burst[0];
		if (!next || setDay(set) === setDay(next) && next.at - set.at <= 12e4) burst.unshift(set);
		else break;
	}
	if (burst.length === 0) return null;
	return burst.slice(0, 20).map((set) => ({
		weightKg: set.weightKg,
		reps: Math.max(1, set.reps)
	}));
}
function orderLatestGroupFirst(sets) {
	const chronological = [...sets].sort((a, b) => a.at - b.at);
	const groups = [];
	for (const set of chronological) {
		const group = groups[groups.length - 1];
		const prev = group?.[group.length - 1];
		if (group && prev && set.at - prev.at <= 12e4 && set.exerciseId === prev.exerciseId) group.push(set);
		else groups.push([set]);
	}
	return groups.reverse().flat();
}
function PlateApp() {
	const exercises = useGym((s) => s.exercises);
	const sets = useGym((s) => s.sets);
	const unit = useGym((s) => s.unit);
	const activeExerciseId = useGym((s) => s.activeExerciseId);
	const hydrated = useGym((s) => s.hydrated);
	const syncError = useGym((s) => s.syncError);
	const hydrateAccount = useGym((s) => s.hydrateAccount);
	const addSet = useGym((s) => s.addSet);
	const updateSet = useGym((s) => s.updateSet);
	const deleteSet = useGym((s) => s.deleteSet);
	const restoreSet = useGym((s) => s.restoreSet);
	const addExercise = useGym((s) => s.addExercise);
	const renameExercise = useGym((s) => s.renameExercise);
	const removeExercise = useGym((s) => s.removeExercise);
	const setUnit = useGym((s) => s.setUnit);
	const setActiveExercise = useGym((s) => s.setActiveExercise);
	const [plan, setPlan] = (0, import_react.useState)([{
		weight: 20,
		reps: 8
	}]);
	const [sheet, setSheet] = (0, import_react.useState)(null);
	const [historyOpen, setHistoryOpen] = (0, import_react.useState)(false);
	const [analyticsOpen, setAnalyticsOpen] = (0, import_react.useState)(false);
	const [selectedDate, setSelectedDate] = (0, import_react.useState)(null);
	const [justLogged, setJustLogged] = (0, import_react.useState)([]);
	const [undo, setUndo] = (0, import_react.useState)(null);
	const setsRef = (0, import_react.useRef)(sets);
	setsRef.current = sets;
	(0, import_react.useEffect)(() => {
		hydrateAccount();
	}, [hydrateAccount]);
	(0, import_react.useEffect)(() => {
		setSelectedDate(dayKey());
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		const previous = planFromHistory(setsRef.current, activeExerciseId);
		const currentUnit = useGym.getState().unit;
		if (previous) setPlan(previous.map((set) => ({
			weight: displayWeight(set.weightKg, currentUnit),
			reps: set.reps
		})));
		else setPlan([{
			weight: fallbackWeight(currentUnit),
			reps: 8
		}]);
	}, [hydrated, activeExerciseId]);
	(0, import_react.useEffect)(() => {
		if (!undo) return;
		const timer = window.setTimeout(() => setUndo(null), 4e3);
		return () => window.clearTimeout(timer);
	}, [undo]);
	(0, import_react.useEffect)(() => {
		if (!sheet && !historyOpen && !analyticsOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const onKey = (event) => {
			if (event.key !== "Escape") return;
			if (sheet) setSheet(null);
			else if (analyticsOpen) setAnalyticsOpen(false);
			else setHistoryOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = previous;
			window.removeEventListener("keydown", onKey);
		};
	}, [
		sheet,
		historyOpen,
		analyticsOpen
	]);
	const exercise = exercises.find((item) => item.id === activeExerciseId) ?? exercises[0];
	const step = STEPS[unit][1];
	const day = selectedDate;
	const daySets = day ? orderLatestGroupFirst(sets.filter((set) => setDay(set) === day)) : [];
	const volume = sessionVolume(daySets, unit);
	const names = new Map(exercises.map((item) => [item.id, item.name]));
	function nudgeWeight(index, direction) {
		setPlan((current) => current.map((set, item) => item === index ? {
			...set,
			weight: Math.min(weightCap(unit), Math.max(0, round2(set.weight + direction * step)))
		} : set));
	}
	function nudgePlannedReps(index, direction) {
		setPlan((current) => current.map((set, item) => item === index ? {
			...set,
			reps: Math.min(999, Math.max(1, set.reps + direction))
		} : set));
	}
	function addPlannedSet() {
		setPlan((current) => {
			if (current.length >= 20) return current;
			const last = current[current.length - 1] ?? {
				weight: fallbackWeight(unit),
				reps: 8
			};
			return [...current, { ...last }];
		});
	}
	function removePlannedAt(index) {
		setPlan((current) => current.length <= 1 ? current : current.filter((_, item) => item !== index));
	}
	function switchUnit() {
		const next = unit === "kg" ? "lb" : "kg";
		setPlan((current) => current.map((set) => ({
			...set,
			weight: displayWeight(unitToKg(set.weight, unit), next)
		})));
		setUnit(next);
	}
	function logSet() {
		if (!exercise || plan.length < 1) return;
		const base = Date.now();
		const performedOn = selectedDate ?? dayKey();
		const ids = [];
		plan.forEach((set, index) => {
			ids.push(addSet({
				exerciseId: exercise.id,
				weightKg: set.weight <= 0 ? 0 : round4(unitToKg(set.weight, unit)),
				reps: set.reps,
				performedOn,
				at: base + index
			}));
		});
		setJustLogged(ids);
		if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(12);
	}
	function remove(entry) {
		deleteSet(entry.id);
		setUndo(entry);
		setSheet(null);
	}
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-lg font-medium tracking-tight",
			children: "Plate"
		})
	});
	const last = exercise && day ? lastLift(sets, exercise.id, unit, day) : null;
	const neverLogged = Boolean(exercise && !sets.some((set) => set.exerciseId === exercise.id));
	const summary = daySets.length === 0 ? "No sets yet" : volume > 0 ? `${daySets.length} ${daySets.length === 1 ? "set" : "sets"} · ${formatAmount(volume)} ${unit}` : `${daySets.length} ${daySets.length === 1 ? "set" : "sets"}`;
	const today = dayKey();
	const lastTitle = !last || !day ? "" : last.when === "same-day" ? day === today ? "Earlier today" : "Already logged" : `Last time · ${headingForDay(last.day, today)}`;
	const dateLabel = day ? headingForDay(day, today) : "Today";
	const varied = plan.some((set) => set.weight !== plan[0].weight || set.reps !== plan[0].reps);
	const dateBit = day && day !== today ? ` · ${dateLabel}` : "";
	const logLabel = plan.length <= 1 ? `Log set${dateBit}` : varied && plan.length <= 3 ? `Log ${plan.map((set) => `${set.weight <= 0 ? "BW" : formatAmount(set.weight)}×${set.reps}`).join(" · ")}${dateBit}` : `Log ${plan.length} sets${dateBit}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "app-wash min-h-dvh text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex min-h-dvh w-full max-w-md flex-col pt-safe",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex h-14 items-center justify-between px-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "flex items-center gap-2 text-lg font-medium tracking-tight",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateMark, { className: "size-6" }), "Plate"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "focus-ring tap h-11 rounded-sm px-3 text-sm font-medium text-muted",
									onClick: switchUnit,
									"aria-label": `Unit ${unit}. Switch unit`,
									children: unit
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-accent",
									onClick: () => setAnalyticsOpen(true),
									"aria-label": "Progress",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, {
										className: "size-5",
										strokeWidth: 1.75
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-fg",
									onClick: () => setHistoryOpen(true),
									"aria-label": "History",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, {
										className: "size-5",
										strokeWidth: 1.75
									})
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "account-slot px-4 pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
					}),
					syncError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "px-4 pb-2 text-sm text-muted",
						children: [
							syncError,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "focus-ring tap font-medium text-fg",
								onClick: () => void hydrateAccount(),
								children: "Retry"
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 px-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-fg",
										"aria-label": "Previous day",
										onClick: () => day && setSelectedDate(shiftDay(day, -1)),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
											className: "size-5",
											strokeWidth: 1.75
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "relative grid min-h-11 place-items-center px-3 text-center",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-medium",
												children: dateLabel
											}),
											day && day !== today ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-subtle",
												children: calendarLabel(day)
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-subtle",
												children: "Tap to change date"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "date",
												value: day ?? today,
												max: today,
												"aria-label": "Session date",
												onChange: (event) => {
													const value = event.target.value;
													if (value && value <= today) setSelectedDate(value);
												},
												className: "date-hit"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-fg disabled:opacity-30",
										"aria-label": "Next day",
										disabled: !day || day >= today,
										onClick: () => day && day < today && setSelectedDate(shiftDay(day, 1)),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
											className: "size-5",
											strokeWidth: 1.75
										})
									})
								]
							}),
							exercise ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "focus-ring tap flex w-full items-center justify-between gap-3 rounded-lg border-l-[3px] border-accent bg-surface px-4 py-3 text-left",
								onClick: () => setSheet({ kind: "exercise" }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate text-lg font-medium tracking-tight",
										children: exercise.name
									}), neverLogged ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-0.5 block truncate text-sm text-muted",
										children: "First time"
									}) : null]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
									className: "size-5 shrink-0 text-subtle",
									strokeWidth: 1.75
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "rounded-lg bg-surface p-3",
								onSubmit: (event) => {
									event.preventDefault();
									const field = event.currentTarget.elements.namedItem("exercise");
									if (!(field instanceof HTMLInputElement)) return;
									addExercise(field.value);
									field.value = "";
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: "Name the exercise"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											name: "exercise",
											"aria-label": "Exercise name",
											placeholder: "Bench press",
											maxLength: 40,
											className: "focus-ring h-12 min-w-0 flex-1 rounded-sm bg-surface-2 px-3 text-base text-fg placeholder:text-subtle"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "submit",
											className: "focus-ring tap h-12 rounded-sm bg-accent px-4 text-sm font-medium text-accent-fg",
											children: "Add"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: SUGGESTIONS.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "focus-ring tap h-10 rounded-full bg-surface-2 px-3 text-sm text-muted",
											onClick: () => addExercise(name),
											children: name
										}, name))
									})
								]
							}),
							last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-accent-soft px-4 py-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium text-muted",
										children: lastTitle
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-2xl font-medium tracking-tight text-accent nums",
										children: [
											last.weight <= 0 ? "Bodyweight" : formatWeight(last.weight, unit),
											" × ",
											last.reps
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-xs text-subtle",
										children: "Heaviest set"
									})
								]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-surface px-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium",
										children: "Sets"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm disabled:opacity-30",
												onClick: () => removePlannedAt(plan.length - 1),
												disabled: plan.length <= 1,
												"aria-label": "Fewer sets",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
													className: "size-5",
													strokeWidth: 1.75
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-8 text-center text-xl font-medium text-accent nums",
												"aria-live": "polite",
												children: plan.length
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm disabled:opacity-30",
												onClick: addPlannedSet,
												disabled: plan.length >= 20,
												"aria-label": "More sets",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
													className: "size-5",
													strokeWidth: 1.75
												})
											})
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 flex flex-col gap-2",
									children: plan.map((set, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "rounded-md bg-surface-2 px-2 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-2 px-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs font-medium text-subtle",
												children: ["Set ", index + 1]
											}), plan.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-muted",
												onClick: () => removePlannedAt(index),
												"aria-label": `Remove set ${index + 1}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
													className: "size-4",
													strokeWidth: 1.75
												})
											}) : null]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-1 grid grid-cols-2 gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-sm disabled:opacity-30",
														onClick: () => nudgeWeight(index, -1),
														disabled: set.weight <= 0,
														"aria-label": `Decrease weight for set ${index + 1}`,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
															className: "size-5",
															strokeWidth: 1.75
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														className: "focus-ring tap min-w-0 flex-1 text-center",
														onClick: () => setSheet({
															kind: "weight",
															index
														}),
														"aria-label": `Set ${index + 1} weight, ${set.weight <= 0 ? "bodyweight" : `${formatAmount(set.weight)} ${unit}`}. Tap to type`,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "block text-xl font-medium leading-none nums",
															children: set.weight <= 0 ? "BW" : formatAmount(set.weight)
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "mt-1 block text-xs text-subtle",
															children: set.weight <= 0 ? "body" : unit
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-sm disabled:opacity-30",
														onClick: () => nudgeWeight(index, 1),
														disabled: set.weight >= weightCap(unit),
														"aria-label": `Increase weight for set ${index + 1}`,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
															className: "size-5",
															strokeWidth: 1.75
														})
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-sm disabled:opacity-30",
														onClick: () => nudgePlannedReps(index, -1),
														disabled: set.reps <= 1,
														"aria-label": `Decrease reps for set ${index + 1}`,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
															className: "size-5",
															strokeWidth: 1.75
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														className: "focus-ring tap min-w-0 flex-1 text-center",
														onClick: () => setSheet({
															kind: "reps",
															index
														}),
														"aria-label": `Set ${index + 1}, ${set.reps} reps. Tap to type`,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "block text-xl font-medium leading-none nums",
															children: set.reps
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "mt-1 block text-xs text-subtle",
															children: "reps"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: "focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-sm disabled:opacity-30",
														onClick: () => nudgePlannedReps(index, 1),
														disabled: set.reps >= 999,
														"aria-label": `Increase reps for set ${index + 1}`,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
															className: "size-5",
															strokeWidth: 1.75
														})
													})
												]
											})]
										})]
									}, index))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "focus-ring tap log-cta min-h-14 rounded-md bg-accent px-4 py-3 text-center text-base font-medium leading-snug text-accent-fg disabled:opacity-40",
								onClick: logSet,
								disabled: !exercise,
								children: logLabel
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-6 flex flex-1 flex-col px-1 pb-safe",
						"aria-label": dateLabel,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 flex items-baseline justify-between px-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium text-muted",
								children: dateLabel
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: clsx("text-sm nums", daySets.length > 0 ? "text-accent" : "text-subtle"),
								children: summary
							})]
						}), daySets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 py-8 text-center text-sm text-subtle",
							children: "Sets you log show up here."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: daySets.map((set) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: justLogged.includes(set.id) ? "set-in" : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetRow, {
								set,
								name: names.get(set.exerciseId) ?? "Exercise",
								unit,
								highlighted: justLogged.includes(set.id),
								onOpen: () => setSheet({
									kind: "edit",
									set
								}),
								onDelete: () => remove(set)
							})
						}, set.id)) })]
					})
				]
			}),
			sheet?.kind === "exercise" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExerciseSheet, {
				exercises,
				sets,
				activeId: exercise?.id ?? "",
				onClose: () => setSheet(null),
				onPick: (id) => {
					setActiveExercise(id);
					setSheet(null);
				},
				onAdd: (name) => {
					addExercise(name);
					setSheet(null);
				},
				onRename: renameExercise,
				onRemove: removeExercise
			}) : null,
			historyOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistorySheet, {
				sets,
				names,
				unit,
				onClose: () => setHistoryOpen(false),
				onOpen: (set) => setSheet({
					kind: "edit",
					set
				}),
				onDelete: (set) => remove(set)
			}) : null,
			sheet?.kind === "weight" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Keypad, {
				title: `Set ${sheet.index + 1} weight`,
				initial: (plan[sheet.index]?.weight ?? 0) <= 0 ? "0" : formatAmount(plan[sheet.index]?.weight ?? 0),
				allowDecimal: true,
				max: weightCap(unit),
				suffix: unit,
				onClose: () => setSheet(null),
				onCommit: (value) => {
					const index = sheet.index;
					setPlan((current) => current.map((set, item) => item === index ? {
						...set,
						weight: value
					} : set));
					setSheet(null);
				}
			}) : null,
			sheet?.kind === "reps" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Keypad, {
				title: `Set ${sheet.index + 1} reps`,
				initial: String(plan[sheet.index]?.reps ?? 8),
				allowDecimal: false,
				max: 999,
				min: 1,
				suffix: "reps",
				onClose: () => setSheet(null),
				onCommit: (value) => {
					const next = Math.max(1, Math.round(value));
					const index = sheet.index;
					setPlan((current) => current.map((set, item) => item === index ? {
						...set,
						reps: next
					} : set));
					setSheet(null);
				}
			}) : null,
			sheet?.kind === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditSheet, {
				entry: sheet.set,
				name: names.get(sheet.set.exerciseId) ?? "Exercise",
				unit,
				step,
				onClose: () => setSheet(null),
				onSave: (nextWeight, nextReps, performedOn) => {
					updateSet(sheet.set.id, {
						weightKg: nextWeight <= 0 ? 0 : round4(unitToKg(nextWeight, unit)),
						reps: nextReps,
						performedOn
					});
					setSheet(null);
				},
				onDelete: () => remove(sheet.set)
			}) : null,
			analyticsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Analytics, {
				sets,
				exercises,
				unit,
				focusId: exercise?.id ?? "",
				onClose: () => setAnalyticsOpen(false)
			}) : null,
			undo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-safe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-auto mb-3 w-full max-w-md px-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between rounded-md bg-surface-2 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: "Set removed"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "focus-ring tap text-sm font-medium",
							onClick: () => {
								restoreSet(undo);
								setUndo(null);
							},
							children: "Undo"
						})]
					})
				})
			}) : null
		]
	});
}
function SetRow({ set, name, unit, onOpen, onDelete, highlighted = false }) {
	const load = `${formatWeight(displayWeight(set.weightKg, unit), unit)} × ${set.reps}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: clsx("flex items-center rounded-md", highlighted && "bg-accent-soft"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onOpen,
			className: "focus-ring tap flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-3 text-left",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-16 shrink-0 text-sm text-subtle nums",
					children: clockLabel(set.at)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 flex-1 truncate",
					children: name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 font-medium nums",
					children: load
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onDelete,
			className: "focus-ring tap mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-sm text-muted",
			"aria-label": `Delete ${name}, ${load}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
				className: "size-4",
				strokeWidth: 1.75
			})
		})]
	});
}
function Overlay({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-30 flex items-end justify-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "sheet-backdrop absolute inset-0 bg-overlay",
			"aria-label": "Close",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "sheet-panel relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-xl bg-surface px-4 pt-3 pb-safe",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-10 rounded-full bg-line" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-medium tracking-tight",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "focus-ring tap grid h-11 w-11 place-items-center rounded-md text-muted",
						onClick: onClose,
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "size-5",
							strokeWidth: 1.75
						})
					})]
				}),
				children
			]
		})]
	});
}
function ExerciseSheet({ exercises, sets, activeId, onClose, onPick, onAdd, onRename, onRemove }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [draftName, setDraftName] = (0, import_react.useState)("");
	const lastAt = /* @__PURE__ */ new Map();
	for (const set of sets) lastAt.set(set.exerciseId, Math.max(lastAt.get(set.exerciseId) ?? 0, set.at));
	const needle = query.trim().toLowerCase();
	const filtered = [...exercises].filter((item) => item.name.toLowerCase().includes(needle)).sort((a, b) => (lastAt.get(b.id) ?? 0) - (lastAt.get(a.id) ?? 0) || a.name.localeCompare(b.name));
	const exact = exercises.some((item) => item.name.toLowerCase() === needle);
	const suggestions = SUGGESTIONS.filter((name) => !exercises.some((item) => item.name.toLowerCase() === name.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
		title: "Exercise",
		onClose,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value: query,
			onChange: (event) => setQuery(event.target.value),
			placeholder: "Search or add",
			"aria-label": "Search or add an exercise",
			maxLength: 40,
			className: "focus-ring mb-2 h-12 w-full rounded-md bg-surface-2 px-3 text-base text-fg placeholder:text-subtle"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
			needle && !exact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "focus-ring tap flex h-12 w-full items-center rounded-md px-2 text-left font-medium",
				onClick: () => onAdd(query),
				children: ["Add ", query.trim()]
			}) }) : null,
			!needle && suggestions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "mb-2 flex flex-wrap gap-2 px-1",
				children: suggestions.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "focus-ring tap h-10 rounded-full bg-surface-2 px-3 text-sm text-muted",
					onClick: () => onAdd(name),
					children: name
				}, name))
			}) : null,
			filtered.length === 0 && !(needle && !exact) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "px-1 py-6 text-center text-sm text-subtle",
				children: "Add an exercise to start"
			}) : filtered.map((item) => {
				const removable = !sets.some((set) => set.exerciseId === item.id);
				const editing = editingId === item.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-1",
					children: [
						editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "flex min-w-0 flex-1 gap-2",
							onSubmit: (event) => {
								event.preventDefault();
								onRename(item.id, draftName);
								setEditingId(null);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: draftName,
								onChange: (event) => setDraftName(event.target.value),
								"aria-label": `Rename ${item.name}`,
								autoFocus: true,
								maxLength: 40,
								className: "focus-ring h-12 min-w-0 flex-1 rounded-sm bg-surface-2 px-3 text-base text-fg"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "focus-ring tap h-12 rounded-sm bg-accent px-3 text-sm font-medium text-accent-fg",
								children: "Save"
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "focus-ring tap flex h-12 min-w-0 flex-1 items-center justify-between rounded-md px-2 text-left",
							onClick: () => onPick(item.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: item.name
							}), item.id === activeId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted",
								children: "Selected"
							}) : null]
						}),
						!editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-md text-subtle",
							"aria-label": `Rename ${item.name}`,
							onClick: () => {
								setEditingId(item.id);
								setDraftName(item.name);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {
								className: "size-4",
								strokeWidth: 1.75
							})
						}) : null,
						removable && !editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-md text-subtle",
							"aria-label": `Remove ${item.name}`,
							onClick: () => onRemove(item.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								className: "size-4",
								strokeWidth: 1.75
							})
						}) : null
					]
				}, item.id);
			})
		] })]
	});
}
function HistorySheet({ sets, names, unit, onClose, onOpen, onDelete }) {
	const groups = /* @__PURE__ */ new Map();
	for (const set of [...sets].sort((a, b) => setDay(b).localeCompare(setDay(a)) || b.at - a.at)) {
		const id = setDay(set);
		const bucket = groups.get(id);
		if (bucket) bucket.push(set);
		else groups.set(id, [set]);
	}
	const days = [...groups.entries()];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-20 flex justify-center bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-dvh w-full max-w-md flex-col pt-safe pb-safe",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-14 items-center gap-2 px-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "focus-ring tap grid h-11 w-11 place-items-center rounded-sm",
					onClick: onClose,
					"aria-label": "Back",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "size-5",
						strokeWidth: 1.75
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-medium tracking-tight",
					children: "History"
				})]
			}), days.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-5 py-16 text-center text-sm text-subtle",
				children: "No sessions yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-2",
				children: days.map(([id, daySets]) => {
					const chronological = [...daySets].sort((a, b) => a.at - b.at);
					const dayVolume = sessionVolume(chronological, unit);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mb-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-medium text-muted",
								children: headingForDay(id)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-subtle nums",
								children: [
									chronological.length,
									" ",
									chronological.length === 1 ? "set" : "sets",
									dayVolume > 0 ? ` · ${formatAmount(dayVolume)} ${unit}` : ""
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: chronological.map((set) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetRow, {
							set,
							name: names.get(set.exerciseId) ?? "Exercise",
							unit,
							onOpen: () => onOpen(set),
							onDelete: () => onDelete(set)
						}) }, set.id)) })]
					}, id);
				})
			})]
		})
	});
}
function EditSheet({ entry, name, unit, step, onClose, onSave, onDelete }) {
	const [weight, setWeight] = (0, import_react.useState)(displayWeight(entry.weightKg, unit));
	const [reps, setReps] = (0, import_react.useState)(entry.reps);
	const [performedOn, setPerformedOn] = (0, import_react.useState)(setDay(entry));
	const today = dayKey();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
		title: "Edit set",
		onClose,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 truncate text-sm text-muted",
				children: name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mb-4 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-subtle",
					children: "Date"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: performedOn,
					max: today,
					onChange: (event) => {
						if (event.target.value && event.target.value <= today) setPerformedOn(event.target.value);
					},
					className: "focus-ring mt-1 h-12 w-full rounded-md bg-surface-2 px-3 text-base text-fg"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Weight",
					value: weight <= 0 ? "BW" : formatAmount(weight),
					onDecrease: () => setWeight((current) => Math.max(0, round2(current - step))),
					onIncrease: () => setWeight((current) => Math.min(weightCap(unit), round2(current + step)))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorField, {
					label: "Reps",
					value: String(reps),
					onDecrease: () => setReps((current) => Math.max(1, current - 1)),
					onIncrease: () => setReps((current) => Math.min(999, current + 1))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "focus-ring tap mt-4 h-14 w-full rounded-md bg-accent text-base font-medium text-accent-fg",
				onClick: () => onSave(weight, reps, performedOn),
				children: "Save"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "focus-ring tap mt-2 h-12 w-full rounded-md bg-surface-2 text-sm font-medium text-fg",
				onClick: onDelete,
				children: "Delete set"
			})
		]
	});
}
function EditorField({ label, value, onDecrease, onIncrease }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-surface-2 p-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm text-subtle",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-center text-3xl font-medium tracking-tight nums",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `Decrease ${label.toLowerCase()}`,
					className: "focus-ring tap grid h-12 place-items-center rounded-xs bg-surface text-fg",
					onClick: onDecrease,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
						className: "size-5",
						strokeWidth: 1.75
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `Increase ${label.toLowerCase()}`,
					className: "focus-ring tap grid h-12 place-items-center rounded-xs bg-surface text-fg",
					onClick: onIncrease,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-5",
						strokeWidth: 1.75
					})
				})]
			})
		]
	});
}
function Keypad({ title, initial, allowDecimal, max, min = 0, suffix, onClose, onCommit }) {
	const [buffer, setBuffer] = (0, import_react.useState)(initial.replace(/,/g, ""));
	const [fresh, setFresh] = (0, import_react.useState)(true);
	function press(key) {
		if (key === "back") {
			setFresh(false);
			setBuffer((prev) => {
				const next = prev.slice(0, -1);
				return next === "" ? "0" : next;
			});
			return;
		}
		if (key === ".") {
			if (!allowDecimal) return;
			setBuffer((prev) => fresh ? "0." : prev.includes(".") ? prev : `${prev}.`);
			setFresh(false);
			return;
		}
		setBuffer((prev) => {
			const next = `${fresh || prev === "0" ? "" : prev}${key}` || "0";
			const numeric = Number(next);
			if (!Number.isFinite(numeric) || numeric > max) return prev;
			const dot = next.indexOf(".");
			if (dot !== -1 && next.length - dot - 1 > 2) return prev;
			return next;
		});
		setFresh(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Overlay, {
		title,
		onClose,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-4 text-center text-5xl font-medium leading-none tracking-tight nums",
				children: [buffer, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2 text-base font-normal text-muted",
					children: suffix
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8",
					"9",
					allowDecimal ? "." : "",
					"0",
					"back"
				].map((key) => key === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}, "blank") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "focus-ring tap grid h-14 place-items-center rounded-md bg-surface-2 text-xl font-medium",
					onClick: () => press(key),
					"aria-label": key === "back" ? "Delete" : key === "." ? "Decimal" : key,
					children: key === "back" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Delete, {
						className: "size-5",
						strokeWidth: 1.75
					}) : key
				}, key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "focus-ring tap mt-3 h-14 w-full rounded-md bg-accent text-base font-medium text-accent-fg",
				onClick: () => {
					const numeric = Number(buffer);
					if (!Number.isFinite(numeric)) return;
					onCommit(Math.min(max, Math.max(min, round2(numeric))));
				},
				children: "Done"
			})
		]
	});
}
function Home() {
	const { user, isPending } = useCurrentUserState();
	const [waited, setWaited] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => setWaited(true), 2e3);
		return () => window.clearTimeout(timer);
	}, []);
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateApp, {});
	if (isPending && !waited) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-6 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-medium tracking-tight",
				children: "Plate"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Checking your account…"
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthScreen, {});
}
//#endregion
export { Home as component };
