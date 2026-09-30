import { useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { clsx } from "clsx";
import { differenceInCalendarDays, format, startOfWeek } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calendarLabel,
  clockLabel,
  dayKey,
  displayWeight,
  formatAmount,
  formatWeight,
  headingForDay,
  round2,
  sessionVolume,
  setDay,
  shiftDay,
} from "@/lib/gym/format";
import type { Exercise, LiftSet, Unit } from "@/lib/gym/store";

type Mode = "top" | "lifted";
type Panel = "exercise" | "days";

type DayPoint = {
  day: string;
  label: string;
  top: number;
  reps: number;
  volume: number;
  e1rm: number;
  estWeight: number;
  estReps: number;
};

function localDay(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year || 1970, (month || 1) - 1, date || 1);
}

function epley(kg: number, reps: number): number {
  if (kg <= 0 || reps < 1) return 0;
  return kg * (1 + reps / 30);
}

function buildVolume(sets: LiftSet[], unit: Unit, today: string) {
  const byDay = new Map<string, LiftSet[]>();
  for (const set of sets) {
    const day = setDay(set);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(set);
    else byDay.set(day, [set]);
  }
  const days = [...byDay.keys()].sort();
  if (days.length === 0) {
    return { title: "Volume", span: "", points: [] as { label: string; volume: number }[] };
  }
  const first = days[0] ?? today;
  const last = days[days.length - 1] ?? today;
  const span =
    first === last
      ? first === today
        ? "Today"
        : calendarLabel(first)
      : `${calendarLabel(first)} – ${last === today ? "today" : calendarLabel(last)}`;
  const spanDays = Math.max(0, differenceInCalendarDays(localDay(last), localDay(first)));
  if (spanDays <= 28) {
    const points = [];
    for (let index = 0; index <= spanDays; index += 1) {
      const day = shiftDay(first, index);
      points.push({
        label: day === today ? "Today" : format(localDay(day), spanDays > 14 ? "d" : "d MMM"),
        volume: sessionVolume(byDay.get(day) ?? [], unit),
      });
    }
    return { title: "Daily volume", span, points };
  }

  const byWeek = new Map<string, LiftSet[]>();
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
      volume: sessionVolume(byWeek.get(cursor) ?? [], unit),
    });
    cursor = shiftDay(cursor, 7);
    guard += 1;
  }
  return { title: "Weekly volume", span, points };
}

function exerciseDays(sets: LiftSet[], exerciseId: string, unit: Unit, today: string): DayPoint[] {
  const byDay = new Map<string, LiftSet[]>();
  for (const set of sets) {
    if (set.exerciseId !== exerciseId) continue;
    const day = setDay(set);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(set);
    else byDay.set(day, [set]);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, list]) => {
      let top = list[0];
      let estimate = list[0];
      for (const set of list) {
        if (!top || set.weightKg > top.weightKg || (set.weightKg === top.weightKg && set.reps > top.reps)) top = set;
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
        estReps: estimate?.reps ?? 0,
      };
    });
}

function progressCopy(points: DayPoint[], unit: Unit): { headline: string; detail: string } | null {
  if (points.length === 0) return null;
  const latest = points[points.length - 1];
  if (!latest) return null;
  const load = latest.top <= 0 ? "Bodyweight" : `${formatAmount(latest.top)} ${unit} × ${latest.reps}`;
  if (points.length === 1) {
    return {
      headline: load,
      detail: "One session so far. Log it again and the line starts.",
    };
  }
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

  const lifted =
    latest.volume === previous.volume
      ? ""
      : ` That day moved ${formatAmount(latest.volume)} ${unit}, the one before ${formatAmount(previous.volume)} ${unit}.`;
  const from =
    first.top <= 0 ? "bodyweight" : `${formatAmount(first.top)} ${unit}`;
  return {
    headline,
    detail: `${recent}${lifted} Started at ${from} on ${calendarLabel(first.day)}.`,
  };
}

function bestEstimate(points: DayPoint[]): DayPoint | null {
  let best: DayPoint | null = null;
  for (const point of points) {
    if (point.e1rm <= 0) continue;
    if (!best || point.e1rm > best.e1rm) best = point;
  }
  return best;
}

function groupDays(sets: LiftSet[]) {
  const map = new Map<string, LiftSet[]>();
  for (const set of sets) {
    const day = setDay(set);
    const list = map.get(day);
    if (list) list.push(set);
    else map.set(day, [set]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, list]) => {
      const ordered = [...list].sort((a, b) => a.at - b.at);
      const byExercise = new Map<string, LiftSet[]>();
      for (const set of ordered) {
        const bucket = byExercise.get(set.exerciseId);
        if (bucket) bucket.push(set);
        else byExercise.set(set.exerciseId, [set]);
      }
      return { day, exercises: [...byExercise.entries()] };
    });
}

function ChartTip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: DayPoint }>;
  unit: Unit;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-sm bg-surface-2 px-2.5 py-1.5 text-xs">
      <p className="text-subtle">{point.label}</p>
      <p className="font-medium nums">
        {point.top <= 0 ? "BW" : `${formatAmount(point.top)} ${unit}`} × {point.reps}
      </p>
      <p className="text-muted nums">{formatAmount(point.volume)} {unit} lifted</p>
    </div>
  );
}

export function Analytics({
  sets,
  exercises,
  unit,
  focusId,
  onClose,
}: {
  sets: LiftSet[];
  exercises: Exercise[];
  unit: Unit;
  focusId: string;
  onClose: () => void;
}) {
  const today = dayKey();
  const [selectedId, setSelectedId] = useState(focusId);
  const [mode, setMode] = useState<Mode>("top");
  const [panel, setPanel] = useState<Panel>("exercise");
  const [dayPick, setDayPick] = useState("");
  const chart = buildVolume(sets, unit, today);
  const sessionCount = new Set(sets.map((set) => setDay(set))).size;
  const names = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
  const best = new Map<string, LiftSet>();
  for (const set of sets) {
    const current = best.get(set.exerciseId);
    if (!current || set.weightKg > current.weightKg || (set.weightKg === current.weightKg && set.reps > current.reps)) {
      best.set(set.exerciseId, set);
    }
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

  return (
    <div className="app-wash fixed inset-0 z-20 flex justify-center text-fg">
      <div className="flex h-dvh w-full max-w-md flex-col pt-safe pb-safe">
        <header className="flex h-14 items-center gap-2 px-2">
          <button
            type="button"
            className="focus-ring tap grid h-11 w-11 place-items-center rounded-sm"
            onClick={onClose}
            aria-label="Back"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
          <h2 className="text-lg font-medium tracking-tight">Progress</h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Volume" value={`${formatAmount(sessionVolume(sets, unit))} ${unit}`} />
            <Stat label="Sessions" value={String(sessionCount)} />
            <Stat label="Sets" value={String(sets.length)} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Progress view">
            {(
              [
                ["exercise", "Exercise"],
                ["days", "Days"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={panel === value}
                className={clsx(
                  "focus-ring tap h-11 rounded-md text-sm font-medium",
                  panel === value ? "bg-accent text-accent-fg" : "bg-surface text-muted",
                )}
                onClick={() => setPanel(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {panel === "exercise" && exercises.length > 0 && focus ? (
            <>
              <FieldSelect
                label="Exercise"
                value={focus.id}
                onChange={setSelectedId}
              >
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </FieldSelect>

              {copy ? (
                <div className="mt-3 rounded-md bg-accent-soft px-3 py-3">
                  <p className="text-base font-medium">{copy.headline}</p>
                  <p className="mt-1 text-sm leading-snug text-muted">{copy.detail}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-subtle">No sets for this exercise yet.</p>
              )}

              {points.length > 0 ? (
                <>
                  <div className="mt-4 flex gap-2" role="group" aria-label="Chart">
                    {(
                      [
                        ["top", "Top weight"],
                        ["lifted", "Weight lifted"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={mode === value}
                        className={clsx(
                          "focus-ring tap h-10 rounded-full px-3 text-sm",
                          mode === value ? "bg-accent text-accent-fg" : "bg-surface text-muted",
                        )}
                        onClick={() => setMode(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-subtle">
                    {mode === "top"
                      ? "Heaviest weight each day you logged this exercise."
                      : `Weight × reps each day, in ${unit}.`}
                  </p>
                  <div className="mt-2 h-52 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--color-line)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={18}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          width={40}
                          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          domain={([dataMin, dataMax]: [number, number]) => {
                            if (mode === "lifted") return [0, dataMax <= 0 ? 1 : dataMax * 1.08];
                            const pad = Math.max(2.5, (dataMax - dataMin) * 0.35);
                            return [Math.max(0, dataMin - pad), dataMax + pad];
                          }}
                          tickFormatter={(value: number) => formatAmount(value)}
                        />
                        <Tooltip
                          content={<ChartTip unit={unit} />}
                          cursor={{ stroke: "var(--color-line)" }}
                        />
                        <Line
                          type="linear"
                          dataKey={lineKey}
                          stroke="var(--color-accent)"
                          strokeWidth={2.5}
                          dot={showDots ? { r: 3, fill: "var(--color-accent)", strokeWidth: 0 } : false}
                          activeDot={{ r: 5 }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {estimate && estimate.e1rm > estimate.top ? (
                    <p className="mt-2 text-sm text-muted">
                      Strength estimate{" "}
                      <span className="font-medium text-accent nums">
                        {formatAmount(estimate.e1rm)} {unit}
                      </span>
                      <span className="text-subtle">
                        {" "}
                        from {estimate.estWeight <= 0 ? "BW" : formatAmount(estimate.estWeight)} × {estimate.estReps}
                      </span>
                    </p>
                  ) : null}
                </>
              ) : null}

              {points.length > 0 ? (
                <ul className="mt-2">
                  {[...points].reverse().map((point) => (
                    <li key={point.day} className="flex items-baseline justify-between gap-3 py-2">
                      <span className="text-sm text-muted">{point.day === today ? "Today" : calendarLabel(point.day)}</span>
                      <span className="text-right font-medium text-accent nums">
                        {point.top <= 0 ? "BW" : formatWeight(point.top, unit)} × {point.reps}
                        <span className="font-normal text-subtle"> · {formatAmount(point.volume)} {unit}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          {panel === "days" ? (
            <>
              <FieldSelect label="Day" value={dayPick} onChange={setDayPick}>
                <option value="">All days</option>
                {days.map((group) => (
                  <option key={group.day} value={group.day}>
                    {group.day === today ? "Today" : headingForDay(group.day, today)}
                  </option>
                ))}
              </FieldSelect>
              {visibleDays.length === 0 ? (
                <p className="mt-3 text-sm text-subtle">Log a few sets and this fills in.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {visibleDays.map((group) => {
                    const flat = group.exercises.flatMap(([, list]) => list);
                    return (
                      <li key={group.day} className="rounded-md bg-surface px-3 py-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-medium">{group.day === today ? "Today" : headingForDay(group.day, today)}</h3>
                          <p className="text-sm text-accent nums">
                            {flat.length} {flat.length === 1 ? "set" : "sets"} · {formatAmount(sessionVolume(flat, unit))} {unit}
                          </p>
                        </div>
                        {group.day !== today ? (
                          <p className="text-xs text-subtle">{calendarLabel(group.day)}</p>
                        ) : null}
                        <ul className="mt-2">
                          {group.exercises.map(([exerciseId, list]) => (
                            <li key={exerciseId} className="border-t border-line py-2 first:border-t-0">
                              <p className="text-sm text-muted">{names.get(exerciseId) ?? "Exercise"}</p>
                              <ul className="mt-1">
                                {list.map((set) => (
                                  <li key={set.id} className="flex items-baseline justify-between gap-3 py-0.5">
                                    <span className="text-xs text-subtle nums">{clockLabel(set.at)}</span>
                                    <span className="font-medium nums">
                                      {set.weightKg <= 0
                                        ? "BW"
                                        : formatWeight(displayWeight(set.weightKg, unit), unit)}{" "}
                                      × {set.reps}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}

          {panel === "exercise" ? (
            <>
          <div className="mt-6 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium text-muted">{chart.title}</h3>
            {chart.span ? <p className="text-xs text-subtle">{chart.span}</p> : null}
          </div>
          {weekSets.length > 0 ? (
            <p className="mt-1 text-xs text-subtle">
              This week · {weekSessions} {weekSessions === 1 ? "session" : "sessions"} · {formatAmount(sessionVolume(weekSets, unit))} {unit}
            </p>
          ) : null}
          {chart.points.length === 0 ? (
            <p className="mt-3 text-sm text-subtle">Log a few sets and this fills in.</p>
          ) : (
            <div className="mt-3 h-40 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.points} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={18}
                    interval="preserveStartEnd"
                  />
                  <Bar dataKey="volume" fill="var(--color-accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <h3 className="mt-6 text-sm font-medium text-muted">Heaviest sets</h3>
          {records.length === 0 ? (
            <p className="mt-3 text-sm text-subtle">Log a few sets and this fills in.</p>
          ) : (
            <ul className="mt-2">
              {records.map((set) => (
                <li key={set.exerciseId} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{names.get(set.exerciseId) ?? "Exercise"}</span>
                  <span className="shrink-0 font-medium text-accent nums">
                    {formatWeight(displayWeight(set.weightKg, unit), unit)} × {set.reps}
                  </span>
                </li>
              ))}
            </ul>
          )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-accent-soft px-3 py-3">
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-1 text-sm font-medium text-accent nums">{value}</p>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="relative mt-2 block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="focus-ring h-12 w-full appearance-none rounded-md bg-surface px-3 pr-10 text-base text-fg"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-subtle" />
      </span>
    </label>
  );
}
