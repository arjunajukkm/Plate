import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { BarChart3, ChevronDown, ChevronLeft, ChevronRight, Delete, History, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import { UserButton } from "@/lib/auth/gates";
import { Analytics } from "@/components/gym/analytics";
import { PlateMark } from "@/components/gym/plate-mark";
import {
  STEPS,
  calendarLabel,
  clockLabel,
  lastLift,
  dayKey,
  displayWeight,
  fallbackWeight,
  formatAmount,
  formatWeight,
  headingForDay,
  round2,
  round4,
  sessionVolume,
  setDay,
  shiftDay,
  unitToKg,
  weightCap,
} from "@/lib/gym/format";
import { SUGGESTIONS, useGym, type Exercise, type LiftSet, type Unit } from "@/lib/gym/store";

type Sheet =
  | { kind: "exercise" }
  | { kind: "weight"; index: number }
  | { kind: "reps"; index: number }
  | { kind: "edit"; set: LiftSet }
  | null;

type PlannedSet = { weight: number; reps: number };

function planFromHistory(all: LiftSet[], exerciseId: string): { weightKg: number; reps: number }[] | null {
  const chronological = all
    .filter((set) => set.exerciseId === exerciseId)
    .sort((a, b) => a.at - b.at);
  if (chronological.length === 0) return null;
  const burst: LiftSet[] = [];
  for (let index = chronological.length - 1; index >= 0; index -= 1) {
    const set = chronological[index];
    const next = burst[0];
    if (!next || (setDay(set) === setDay(next) && next.at - set.at <= 2 * 60 * 1000)) {
      burst.unshift(set);
    } else {
      break;
    }
  }
  if (burst.length === 0) return null;
  return burst.slice(0, 20).map((set) => ({ weightKg: set.weightKg, reps: Math.max(1, set.reps) }));
}

function orderLatestGroupFirst(sets: LiftSet[]): LiftSet[] {
  const chronological = [...sets].sort((a, b) => a.at - b.at);
  const groups: LiftSet[][] = [];
  for (const set of chronological) {
    const group = groups[groups.length - 1];
    const prev = group?.[group.length - 1];
    if (group && prev && set.at - prev.at <= 2 * 60 * 1000 && set.exerciseId === prev.exerciseId) {
      group.push(set);
    } else {
      groups.push([set]);
    }
  }
  return groups.reverse().flat();
}

export function PlateApp() {
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

  const [plan, setPlan] = useState<PlannedSet[]>([{ weight: 20, reps: 8 }]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState<string[]>([]);
  const [undo, setUndo] = useState<LiftSet | null>(null);
  const setsRef = useRef(sets);
  setsRef.current = sets;

  useEffect(() => {
    void hydrateAccount();
  }, [hydrateAccount]);

  useEffect(() => {
    setSelectedDate(dayKey());
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const previous = planFromHistory(setsRef.current, activeExerciseId);
    const currentUnit = useGym.getState().unit;
    if (previous) {
      setPlan(
        previous.map((set) => ({
          weight: displayWeight(set.weightKg, currentUnit),
          reps: set.reps,
        })),
      );
    } else {
      setPlan([{ weight: fallbackWeight(currentUnit), reps: 8 }]);
    }
  }, [hydrated, activeExerciseId]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), 4000);
    return () => window.clearTimeout(timer);
  }, [undo]);

  useEffect(() => {
    if (!sheet && !historyOpen && !analyticsOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
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
  }, [sheet, historyOpen, analyticsOpen]);

  const exercise = exercises.find((item) => item.id === activeExerciseId) ?? exercises[0];
  const step = STEPS[unit][1];
  const day = selectedDate;
  const daySets = day ? orderLatestGroupFirst(sets.filter((set) => setDay(set) === day)) : [];
  const volume = sessionVolume(daySets, unit);
  const names = new Map(exercises.map((item) => [item.id, item.name]));

  function nudgeWeight(index: number, direction: -1 | 1) {
    setPlan((current) =>
      current.map((set, item) =>
        item === index
          ? { ...set, weight: Math.min(weightCap(unit), Math.max(0, round2(set.weight + direction * step))) }
          : set,
      ),
    );
  }

  function nudgePlannedReps(index: number, direction: -1 | 1) {
    setPlan((current) =>
      current.map((set, item) =>
        item === index ? { ...set, reps: Math.min(999, Math.max(1, set.reps + direction)) } : set,
      ),
    );
  }

  function addPlannedSet() {
    setPlan((current) => {
      if (current.length >= 20) return current;
      const last = current[current.length - 1] ?? { weight: fallbackWeight(unit), reps: 8 };
      return [...current, { ...last }];
    });
  }

  function removePlannedAt(index: number) {
    setPlan((current) => (current.length <= 1 ? current : current.filter((_, item) => item !== index)));
  }

  function switchUnit() {
    const next: Unit = unit === "kg" ? "lb" : "kg";
    setPlan((current) =>
      current.map((set) => ({
        ...set,
        weight: displayWeight(unitToKg(set.weight, unit), next),
      })),
    );
    setUnit(next);
  }

  function logSet() {
    if (!exercise || plan.length < 1) return;
    const base = Date.now();
    const performedOn = selectedDate ?? dayKey();
    const ids: string[] = [];
    plan.forEach((set, index) => {
      ids.push(
        addSet({
          exerciseId: exercise.id,
          weightKg: set.weight <= 0 ? 0 : round4(unitToKg(set.weight, unit)),
          reps: set.reps,
          performedOn,
          at: base + index,
        }),
      );
    });
    setJustLogged(ids);
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(12);
    }
  }

  function remove(entry: LiftSet) {
    deleteSet(entry.id);
    setUndo(entry);
    setSheet(null);
  }

  if (!hydrated) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg text-fg">
        <p className="text-lg font-medium tracking-tight">Plate</p>
      </main>
    );
  }

  const last = exercise && day ? lastLift(sets, exercise.id, unit, day) : null;
  const neverLogged = Boolean(exercise && !sets.some((set) => set.exerciseId === exercise.id));
  const summary =
    daySets.length === 0
      ? "No sets yet"
      : volume > 0
        ? `${daySets.length} ${daySets.length === 1 ? "set" : "sets"} · ${formatAmount(volume)} ${unit}`
        : `${daySets.length} ${daySets.length === 1 ? "set" : "sets"}`;
  const today = dayKey();
  const lastTitle =
    !last || !day
      ? ""
      : last.when === "same-day"
        ? day === today
          ? "Earlier today"
          : "Already logged"
        : `Last time · ${headingForDay(last.day, today)}`;
  const dateLabel = day ? headingForDay(day, today) : "Today";
  const varied = plan.some((set) => set.weight !== plan[0].weight || set.reps !== plan[0].reps);
  const dateBit = day && day !== today ? ` · ${dateLabel}` : "";
  const logLabel =
    plan.length <= 1
      ? `Log set${dateBit}`
      : varied && plan.length <= 3
        ? `Log ${plan.map((set) => `${set.weight <= 0 ? "BW" : formatAmount(set.weight)}×${set.reps}`).join(" · ")}${dateBit}`
        : `Log ${plan.length} sets${dateBit}`;

  return (
    <main className="app-wash min-h-dvh text-fg">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pt-safe">
        <header className="flex h-14 items-center justify-between px-4">
          <h1 className="flex items-center gap-2 text-lg font-medium tracking-tight">
            <PlateMark className="size-6" />
            Plate
          </h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="focus-ring tap h-11 rounded-sm px-3 text-sm font-medium text-muted"
              onClick={switchUnit}
              aria-label={`Unit ${unit}. Switch unit`}
            >
              {unit}
            </button>
            <button
              type="button"
              className="focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-accent"
              onClick={() => setAnalyticsOpen(true)}
              aria-label="Progress"
            >
              <BarChart3 className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-fg"
              onClick={() => setHistoryOpen(true)}
              aria-label="History"
            >
              <History className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        <div className="account-slot px-4 pb-2">
          <UserButton />
        </div>
        {syncError ? (
          <p className="px-4 pb-2 text-sm text-muted">
            {syncError}{" "}
            <button type="button" className="focus-ring tap font-medium text-fg" onClick={() => void hydrateAccount()}>
              Retry
            </button>
          </p>
        ) : null}

        <div className="flex flex-col gap-3 px-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-fg"
              aria-label="Previous day"
              onClick={() => day && setSelectedDate(shiftDay(day, -1))}
            >
              <ChevronLeft className="size-5" strokeWidth={1.75} />
            </button>
            <label className="relative grid min-h-11 place-items-center px-3 text-center">
              <span className="text-sm font-medium">{dateLabel}</span>
              {day && day !== today ? (
                <span className="text-xs text-subtle">{calendarLabel(day)}</span>
              ) : (
                <span className="text-xs text-subtle">Tap to change date</span>
              )}
              <input
                type="date"
                value={day ?? today}
                max={today}
                aria-label="Session date"
                onChange={(event) => {
                  const value = event.target.value;
                  if (value && value <= today) setSelectedDate(value);
                }}
                className="date-hit"
              />
            </label>
            <button
              type="button"
              className="focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-fg disabled:opacity-30"
              aria-label="Next day"
              disabled={!day || day >= today}
              onClick={() => day && day < today && setSelectedDate(shiftDay(day, 1))}
            >
              <ChevronRight className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          {exercise ? (
            <button
              type="button"
              className="focus-ring tap flex w-full items-center justify-between gap-3 rounded-lg border-l-[3px] border-accent bg-surface px-4 py-3 text-left"
              onClick={() => setSheet({ kind: "exercise" })}
            >
              <span className="min-w-0">
                <span className="block truncate text-lg font-medium tracking-tight">{exercise.name}</span>
                {neverLogged ? (
                  <span className="mt-0.5 block truncate text-sm text-muted">First time</span>
                ) : null}
              </span>
              <ChevronDown className="size-5 shrink-0 text-subtle" strokeWidth={1.75} />
            </button>
          ) : (
            <form
              className="rounded-lg bg-surface p-3"
              onSubmit={(event) => {
                event.preventDefault();
                const field = event.currentTarget.elements.namedItem("exercise");
                if (!(field instanceof HTMLInputElement)) return;
                addExercise(field.value);
                field.value = "";
              }}
            >
              <p className="text-sm text-muted">Name the exercise</p>
              <div className="mt-2 flex gap-2">
                <input
                  name="exercise"
                  aria-label="Exercise name"
                  placeholder="Bench press"
                  maxLength={40}
                  className="focus-ring h-12 min-w-0 flex-1 rounded-sm bg-surface-2 px-3 text-base text-fg placeholder:text-subtle"
                />
                <button
                  type="submit"
                  className="focus-ring tap h-12 rounded-sm bg-accent px-4 text-sm font-medium text-accent-fg"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="focus-ring tap h-10 rounded-full bg-surface-2 px-3 text-sm text-muted"
                    onClick={() => addExercise(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </form>
          )}

          {last ? (
            <div className="rounded-lg bg-accent-soft px-4 py-3">
              <p className="text-xs font-medium text-muted">{lastTitle}</p>
              <p className="mt-1 text-2xl font-medium tracking-tight text-accent nums">
                {last.weight <= 0 ? "Bodyweight" : formatWeight(last.weight, unit)} × {last.reps}
              </p>
              <p className="mt-0.5 text-xs text-subtle">Heaviest set</p>
            </div>
          ) : null}

          <div className="rounded-lg bg-surface px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Sets</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="focus-ring tap grid h-11 w-11 place-items-center rounded-sm disabled:opacity-30"
                  onClick={() => removePlannedAt(plan.length - 1)}
                  disabled={plan.length <= 1}
                  aria-label="Fewer sets"
                >
                  <Minus className="size-5" strokeWidth={1.75} />
                </button>
                <span className="w-8 text-center text-xl font-medium text-accent nums" aria-live="polite">
                  {plan.length}
                </span>
                <button
                  type="button"
                  className="focus-ring tap grid h-11 w-11 place-items-center rounded-sm disabled:opacity-30"
                  onClick={addPlannedSet}
                  disabled={plan.length >= 20}
                  aria-label="More sets"
                >
                  <Plus className="size-5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
            <ul className="mt-2 flex flex-col gap-2">
              {plan.map((set, index) => (
                <li key={index} className="rounded-md bg-surface-2 px-2 py-2">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <p className="text-xs font-medium text-subtle">Set {index + 1}</p>
                    {plan.length > 1 ? (
                      <button
                        type="button"
                        className="focus-ring tap grid h-11 w-11 place-items-center rounded-sm text-muted"
                        onClick={() => removePlannedAt(index)}
                        aria-label={`Remove set ${index + 1}`}
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} />
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-sm disabled:opacity-30"
                        onClick={() => nudgeWeight(index, -1)}
                        disabled={set.weight <= 0}
                        aria-label={`Decrease weight for set ${index + 1}`}
                      >
                        <Minus className="size-5" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        className="focus-ring tap min-w-0 flex-1 text-center"
                        onClick={() => setSheet({ kind: "weight", index })}
                        aria-label={`Set ${index + 1} weight, ${set.weight <= 0 ? "bodyweight" : `${formatAmount(set.weight)} ${unit}`}. Tap to type`}
                      >
                        <span className="block text-xl font-medium leading-none nums">
                          {set.weight <= 0 ? "BW" : formatAmount(set.weight)}
                        </span>
                        <span className="mt-1 block text-xs text-subtle">{set.weight <= 0 ? "body" : unit}</span>
                      </button>
                      <button
                        type="button"
                        className="focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-sm disabled:opacity-30"
                        onClick={() => nudgeWeight(index, 1)}
                        disabled={set.weight >= weightCap(unit)}
                        aria-label={`Increase weight for set ${index + 1}`}
                      >
                        <Plus className="size-5" strokeWidth={1.75} />
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-sm disabled:opacity-30"
                        onClick={() => nudgePlannedReps(index, -1)}
                        disabled={set.reps <= 1}
                        aria-label={`Decrease reps for set ${index + 1}`}
                      >
                        <Minus className="size-5" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        className="focus-ring tap min-w-0 flex-1 text-center"
                        onClick={() => setSheet({ kind: "reps", index })}
                        aria-label={`Set ${index + 1}, ${set.reps} reps. Tap to type`}
                      >
                        <span className="block text-xl font-medium leading-none nums">{set.reps}</span>
                        <span className="mt-1 block text-xs text-subtle">reps</span>
                      </button>
                      <button
                        type="button"
                        className="focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-sm disabled:opacity-30"
                        onClick={() => nudgePlannedReps(index, 1)}
                        disabled={set.reps >= 999}
                        aria-label={`Increase reps for set ${index + 1}`}
                      >
                        <Plus className="size-5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="focus-ring tap log-cta min-h-14 rounded-md bg-accent px-4 py-3 text-center text-base font-medium leading-snug text-accent-fg disabled:opacity-40"
            onClick={logSet}
            disabled={!exercise}
          >
            {logLabel}
          </button>
        </div>

        <section className="mt-6 flex flex-1 flex-col px-1 pb-safe" aria-label={dateLabel}>
          <div className="mb-1 flex items-baseline justify-between px-3">
            <h2 className="text-sm font-medium text-muted">{dateLabel}</h2>
            <p className={clsx("text-sm nums", daySets.length > 0 ? "text-accent" : "text-subtle")}>{summary}</p>
          </div>
          {daySets.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-subtle">Sets you log show up here.</p>
          ) : (
            <ul>
              {daySets.map((set) => (
                <li key={set.id} className={justLogged.includes(set.id) ? "set-in" : undefined}>
                  <SetRow
                    set={set}
                    name={names.get(set.exerciseId) ?? "Exercise"}
                    unit={unit}
                    highlighted={justLogged.includes(set.id)}
                    onOpen={() => setSheet({ kind: "edit", set })}
                    onDelete={() => remove(set)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {sheet?.kind === "exercise" ? (
        <ExerciseSheet
          exercises={exercises}
          sets={sets}
          activeId={exercise?.id ?? ""}
          onClose={() => setSheet(null)}
          onPick={(id) => {
            setActiveExercise(id);
            setSheet(null);
          }}
          onAdd={(name) => {
            addExercise(name);
            setSheet(null);
          }}
          onRename={renameExercise}
          onRemove={removeExercise}
        />
      ) : null}

      {historyOpen ? (
        <HistorySheet
          sets={sets}
          names={names}
          unit={unit}
          onClose={() => setHistoryOpen(false)}
          onOpen={(set) => setSheet({ kind: "edit", set })}
          onDelete={(set) => remove(set)}
        />
      ) : null}

      {sheet?.kind === "weight" ? (
        <Keypad
          title={`Set ${sheet.index + 1} weight`}
          initial={(plan[sheet.index]?.weight ?? 0) <= 0 ? "0" : formatAmount(plan[sheet.index]?.weight ?? 0)}
          allowDecimal
          max={weightCap(unit)}
          suffix={unit}
          onClose={() => setSheet(null)}
          onCommit={(value) => {
            const index = sheet.index;
            setPlan((current) => current.map((set, item) => (item === index ? { ...set, weight: value } : set)));
            setSheet(null);
          }}
        />
      ) : null}

      {sheet?.kind === "reps" ? (
        <Keypad
          title={`Set ${sheet.index + 1} reps`}
          initial={String(plan[sheet.index]?.reps ?? 8)}
          allowDecimal={false}
          max={999}
          min={1}
          suffix="reps"
          onClose={() => setSheet(null)}
          onCommit={(value) => {
            const next = Math.max(1, Math.round(value));
            const index = sheet.index;
            setPlan((current) => current.map((set, item) => (item === index ? { ...set, reps: next } : set)));
            setSheet(null);
          }}
        />
      ) : null}

      {sheet?.kind === "edit" ? (
        <EditSheet
          entry={sheet.set}
          name={names.get(sheet.set.exerciseId) ?? "Exercise"}
          unit={unit}
          step={step}
          onClose={() => setSheet(null)}
          onSave={(nextWeight, nextReps, performedOn) => {
            updateSet(sheet.set.id, {
              weightKg: nextWeight <= 0 ? 0 : round4(unitToKg(nextWeight, unit)),
              reps: nextReps,
              performedOn,
            });
            setSheet(null);
          }}
          onDelete={() => remove(sheet.set)}
        />
      ) : null}

      {analyticsOpen ? (
        <Analytics
          sets={sets}
          exercises={exercises}
          unit={unit}
          focusId={exercise?.id ?? ""}
          onClose={() => setAnalyticsOpen(false)}
        />
      ) : null}

      {undo ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-safe">
          <div className="pointer-events-auto mb-3 w-full max-w-md px-4">
            <div className="flex items-center justify-between rounded-md bg-surface-2 px-4 py-3">
              <span className="text-sm">Set removed</span>
              <button
                type="button"
                className="focus-ring tap text-sm font-medium"
                onClick={() => {
                  restoreSet(undo);
                  setUndo(null);
                }}
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function MetricCard({
  label,
  value,
  unit,
  onOpen,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  value: string;
  unit: string;
  onOpen: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-surface p-3">
      <button
        type="button"
        className="focus-ring tap flex flex-1 flex-col items-center rounded-sm px-1 py-2"
        onClick={onOpen}
        aria-label={`${label}, ${value} ${unit}. Tap to type`}
      >
        <span className="text-sm text-subtle">{label}</span>
        <span
          className={clsx(
            "mt-1 font-medium leading-none tracking-tight nums",
            value.length > 4 ? "text-4xl" : "text-5xl",
          )}
        >
          {value}
        </span>
        <span className="mt-2 text-sm text-muted">{unit}</span>
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <RepeatButton label={decreaseLabel} onPress={onDecrease}>
          <Minus className="size-5" strokeWidth={1.75} />
        </RepeatButton>
        <RepeatButton label={increaseLabel} onPress={onIncrease}>
          <Plus className="size-5" strokeWidth={1.75} />
        </RepeatButton>
      </div>
    </div>
  );
}

function RepeatButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const pressRef = useRef(onPress);
  pressRef.current = onPress;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clear() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }

  useEffect(() => clear, []);

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    clear();
    pressRef.current();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => pressRef.current(), 70);
    }, 320);
  }

  return (
    <button
      type="button"
      aria-label={label}
      className="focus-ring tap grid h-12 place-items-center rounded-sm bg-surface-2 text-fg"
      onPointerDown={start}
      onPointerUp={clear}
      onPointerCancel={clear}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          pressRef.current();
        }
      }}
    >
      {children}
    </button>
  );
}

function SetRow({
  set,
  name,
  unit,
  onOpen,
  onDelete,
  highlighted = false,
}: {
  set: LiftSet;
  name: string;
  unit: Unit;
  onOpen: () => void;
  onDelete: () => void;
  highlighted?: boolean;
}) {
  const shown = displayWeight(set.weightKg, unit);
  const load = `${formatWeight(shown, unit)} × ${set.reps}`;
  return (
    <div className={clsx("flex items-center rounded-md", highlighted && "bg-accent-soft")}>
      <button
        type="button"
        onClick={onOpen}
        className="focus-ring tap flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-3 text-left"
      >
        <span className="w-16 shrink-0 text-sm text-subtle nums">{clockLabel(set.at)}</span>
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="shrink-0 font-medium nums">{load}</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="focus-ring tap mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-sm text-muted"
        aria-label={`Delete ${name}, ${load}`}
      >
        <Trash2 className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <button type="button" className="sheet-backdrop absolute inset-0 bg-overlay" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-panel relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-xl bg-surface px-4 pt-3 pb-safe"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          <button
            type="button"
            className="focus-ring tap grid h-11 w-11 place-items-center rounded-md text-muted"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ExerciseSheet({
  exercises,
  sets,
  activeId,
  onClose,
  onPick,
  onAdd,
  onRename,
  onRemove,
}: {
  exercises: Exercise[];
  sets: LiftSet[];
  activeId: string;
  onClose: () => void;
  onPick: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const lastAt = new Map<string, number>();
  for (const set of sets) {
    lastAt.set(set.exerciseId, Math.max(lastAt.get(set.exerciseId) ?? 0, set.at));
  }
  const needle = query.trim().toLowerCase();
  const filtered = [...exercises]
    .filter((item) => item.name.toLowerCase().includes(needle))
    .sort((a, b) => (lastAt.get(b.id) ?? 0) - (lastAt.get(a.id) ?? 0) || a.name.localeCompare(b.name));
  const exact = exercises.some((item) => item.name.toLowerCase() === needle);
  const suggestions = SUGGESTIONS.filter(
    (name) => !exercises.some((item) => item.name.toLowerCase() === name.toLowerCase()),
  );

  return (
    <Overlay title="Exercise" onClose={onClose}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search or add"
        aria-label="Search or add an exercise"
        maxLength={40}
        className="focus-ring mb-2 h-12 w-full rounded-md bg-surface-2 px-3 text-base text-fg placeholder:text-subtle"
      />
      <ul>
        {needle && !exact ? (
          <li>
            <button
              type="button"
              className="focus-ring tap flex h-12 w-full items-center rounded-md px-2 text-left font-medium"
              onClick={() => onAdd(query)}
            >
              Add {query.trim()}
            </button>
          </li>
        ) : null}
        {!needle && suggestions.length > 0 ? (
          <li className="mb-2 flex flex-wrap gap-2 px-1">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                className="focus-ring tap h-10 rounded-full bg-surface-2 px-3 text-sm text-muted"
                onClick={() => onAdd(name)}
              >
                {name}
              </button>
            ))}
          </li>
        ) : null}
        {filtered.length === 0 && !(needle && !exact) ? (
          <li className="px-1 py-6 text-center text-sm text-subtle">Add an exercise to start</li>
        ) : (
          filtered.map((item) => {
            const removable = !sets.some((set) => set.exerciseId === item.id);
            const editing = editingId === item.id;
            return (
              <li key={item.id} className="flex items-center gap-1">
                {editing ? (
                  <form
                    className="flex min-w-0 flex-1 gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onRename(item.id, draftName);
                      setEditingId(null);
                    }}
                  >
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      aria-label={`Rename ${item.name}`}
                      autoFocus
                      maxLength={40}
                      className="focus-ring h-12 min-w-0 flex-1 rounded-sm bg-surface-2 px-3 text-base text-fg"
                    />
                    <button
                      type="submit"
                      className="focus-ring tap h-12 rounded-sm bg-accent px-3 text-sm font-medium text-accent-fg"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="focus-ring tap flex h-12 min-w-0 flex-1 items-center justify-between rounded-md px-2 text-left"
                    onClick={() => onPick(item.id)}
                  >
                    <span className="truncate">{item.name}</span>
                    {item.id === activeId ? <span className="text-sm text-muted">Selected</span> : null}
                  </button>
                )}
                {!editing ? (
                  <button
                    type="button"
                    className="focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-md text-subtle"
                    aria-label={`Rename ${item.name}`}
                    onClick={() => {
                      setEditingId(item.id);
                      setDraftName(item.name);
                    }}
                  >
                    <Pencil className="size-4" strokeWidth={1.75} />
                  </button>
                ) : null}
                {removable && !editing ? (
                  <button
                    type="button"
                    className="focus-ring tap grid h-11 w-11 shrink-0 place-items-center rounded-md text-subtle"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onRemove(item.id)}
                  >
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </Overlay>
  );
}

function HistorySheet({
  sets,
  names,
  unit,
  onClose,
  onOpen,
  onDelete,
}: {
  sets: LiftSet[];
  names: Map<string, string>;
  unit: Unit;
  onClose: () => void;
  onOpen: (set: LiftSet) => void;
  onDelete: (set: LiftSet) => void;
}) {
  const groups = new Map<string, LiftSet[]>();
  for (const set of [...sets].sort((a, b) => setDay(b).localeCompare(setDay(a)) || b.at - a.at)) {
    const id = setDay(set);
    const bucket = groups.get(id);
    if (bucket) bucket.push(set);
    else groups.set(id, [set]);
  }
  const days = [...groups.entries()];

  return (
    <div className="fixed inset-0 z-20 flex justify-center bg-bg">
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
          <h2 className="text-lg font-medium tracking-tight">History</h2>
        </header>
        {days.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-subtle">No sessions yet.</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-2">
            {days.map(([id, daySets]) => {
              const chronological = [...daySets].sort((a, b) => a.at - b.at);
              const dayVolume = sessionVolume(chronological, unit);
              return (
                <section key={id} className="mb-5">
                  <div className="flex items-baseline justify-between px-3 py-2">
                    <h3 className="text-sm font-medium text-muted">{headingForDay(id)}</h3>
                    <p className="text-sm text-subtle nums">
                      {chronological.length} {chronological.length === 1 ? "set" : "sets"}
                      {dayVolume > 0 ? ` · ${formatAmount(dayVolume)} ${unit}` : ""}
                    </p>
                  </div>
                  <ul>
                    {chronological.map((set) => (
                      <li key={set.id}>
                        <SetRow
                          set={set}
                          name={names.get(set.exerciseId) ?? "Exercise"}
                          unit={unit}
                          onOpen={() => onOpen(set)}
                          onDelete={() => onDelete(set)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EditSheet({
  entry,
  name,
  unit,
  step,
  onClose,
  onSave,
  onDelete,
}: {
  entry: LiftSet;
  name: string;
  unit: Unit;
  step: number;
  onClose: () => void;
  onSave: (weight: number, reps: number, performedOn: string) => void;
  onDelete: () => void;
}) {
  const [weight, setWeight] = useState(displayWeight(entry.weightKg, unit));
  const [reps, setReps] = useState(entry.reps);
  const [performedOn, setPerformedOn] = useState(setDay(entry));
  const today = dayKey();

  return (
    <Overlay title="Edit set" onClose={onClose}>
      <p className="mb-3 truncate text-sm text-muted">{name}</p>
      <label className="mb-4 block">
        <span className="text-sm text-subtle">Date</span>
        <input
          type="date"
          value={performedOn}
          max={today}
          onChange={(event) => {
            if (event.target.value && event.target.value <= today) setPerformedOn(event.target.value);
          }}
          className="focus-ring mt-1 h-12 w-full rounded-md bg-surface-2 px-3 text-base text-fg"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <EditorField
          label="Weight"
          value={weight <= 0 ? "BW" : formatAmount(weight)}
          onDecrease={() => setWeight((current) => Math.max(0, round2(current - step)))}
          onIncrease={() => setWeight((current) => Math.min(weightCap(unit), round2(current + step)))}
        />
        <EditorField
          label="Reps"
          value={String(reps)}
          onDecrease={() => setReps((current) => Math.max(1, current - 1))}
          onIncrease={() => setReps((current) => Math.min(999, current + 1))}
        />
      </div>
      <button
        type="button"
        className="focus-ring tap mt-4 h-14 w-full rounded-md bg-accent text-base font-medium text-accent-fg"
        onClick={() => onSave(weight, reps, performedOn)}
      >
        Save
      </button>
      <button
        type="button"
        className="focus-ring tap mt-2 h-12 w-full rounded-md bg-surface-2 text-sm font-medium text-fg"
        onClick={onDelete}
      >
        Delete set
      </button>
    </Overlay>
  );
}

function EditorField({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="rounded-md bg-surface-2 p-2">
      <p className="text-center text-sm text-subtle">{label}</p>
      <p className="mt-1 text-center text-3xl font-medium tracking-tight nums">{value}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="focus-ring tap grid h-12 place-items-center rounded-xs bg-surface text-fg"
          onClick={onDecrease}
        >
          <Minus className="size-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          className="focus-ring tap grid h-12 place-items-center rounded-xs bg-surface text-fg"
          onClick={onIncrease}
        >
          <Plus className="size-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function Keypad({
  title,
  initial,
  allowDecimal,
  max,
  min = 0,
  suffix,
  onClose,
  onCommit,
}: {
  title: string;
  initial: string;
  allowDecimal: boolean;
  max: number;
  min?: number;
  suffix: string;
  onClose: () => void;
  onCommit: (value: number) => void;
}) {
  const [buffer, setBuffer] = useState(initial.replace(/,/g, ""));
  const [fresh, setFresh] = useState(true);

  function press(key: string) {
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
      setBuffer((prev) => (fresh ? "0." : prev.includes(".") ? prev : `${prev}.`));
      setFresh(false);
      return;
    }
    setBuffer((prev) => {
      const base = fresh || prev === "0" ? "" : prev;
      const next = `${base}${key}` || "0";
      const numeric = Number(next);
      if (!Number.isFinite(numeric) || numeric > max) return prev;
      const dot = next.indexOf(".");
      if (dot !== -1 && next.length - dot - 1 > 2) return prev;
      return next;
    });
    setFresh(false);
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", allowDecimal ? "." : "", "0", "back"];

  return (
    <Overlay title={title} onClose={onClose}>
      <p className="mb-4 text-center text-5xl font-medium leading-none tracking-tight nums">
        {buffer}
        <span className="ml-2 text-base font-normal text-muted">{suffix}</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) =>
          key === "" ? (
            <div key="blank" />
          ) : (
            <button
              key={key}
              type="button"
              className="focus-ring tap grid h-14 place-items-center rounded-md bg-surface-2 text-xl font-medium"
              onClick={() => press(key)}
              aria-label={key === "back" ? "Delete" : key === "." ? "Decimal" : key}
            >
              {key === "back" ? <Delete className="size-5" strokeWidth={1.75} /> : key}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        className="focus-ring tap mt-3 h-14 w-full rounded-md bg-accent text-base font-medium text-accent-fg"
        onClick={() => {
          const numeric = Number(buffer);
          if (!Number.isFinite(numeric)) return;
          onCommit(Math.min(max, Math.max(min, round2(numeric))));
        }}
      >
        Done
      </button>
    </Overlay>
  );
}
