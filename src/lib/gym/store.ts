import { create } from "zustand";
import {
  deleteExercise as deleteExerciseRemote,
  loadLog,
  removeSet,
  renameExercise as renameExerciseRemote,
  saveExercise,
  saveSet,
} from "./api";

export type Unit = "kg" | "lb";

export type Exercise = {
  id: string;
  name: string;
};

export type LiftSet = {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  performedOn: string;
  at: number;
};

export const SUGGESTIONS = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Pull-up",
  "Lat Pulldown",
];

type Prefs = { unit: Unit; stepIndex: 0 | 1 | 2 };

function readPrefs(): Prefs {
  if (typeof localStorage === "undefined") return { unit: "kg", stepIndex: 1 };
  try {
    const raw = localStorage.getItem("plate-prefs");
    if (!raw) return { unit: "kg", stepIndex: 1 };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    const stepIndex = parsed.stepIndex === 0 || parsed.stepIndex === 2 ? parsed.stepIndex : 1;
    return { unit: parsed.unit === "lb" ? "lb" : "kg", stepIndex };
  } catch {
    return { unit: "kg", stepIndex: 1 };
  }
}

function writePrefs(prefs: Prefs) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("plate-prefs", JSON.stringify(prefs));
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 40);
}

type Legacy = {
  exercises?: Exercise[];
  sets?: Array<Partial<LiftSet> & { exerciseId?: string; weightKg?: number; reps?: number; at?: number }>;
};

function dayFromAt(at: number): string {
  const date = new Date(at);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

async function pushLegacy() {
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem("plate-gym-v1");
  if (!raw) return;
  let legacy: { state?: Legacy };
  try {
    legacy = JSON.parse(raw) as { state?: Legacy };
  } catch {
    return;
  }
  const exercises = legacy.state?.exercises ?? [];
  const sets = legacy.state?.sets ?? [];
  if (exercises.length === 0 && sets.length === 0) return;
  for (const exercise of exercises) {
    if (!exercise?.id || !exercise.name) continue;
    await saveExercise({ data: { id: exercise.id, name: exercise.name } });
  }
  for (const set of sets) {
    if (!set?.id || !set.exerciseId || !set.reps) continue;
    const at = typeof set.at === "number" ? set.at : Date.now();
    await saveSet({
      data: {
        id: set.id,
        exerciseId: set.exerciseId,
        weightKg: Number(set.weightKg) || 0,
        reps: Number(set.reps),
        performedOn: set.performedOn || dayFromAt(at),
        at,
      },
    });
  }
  localStorage.removeItem("plate-gym-v1");
}

type GymState = {
  exercises: Exercise[];
  sets: LiftSet[];
  unit: Unit;
  stepIndex: 0 | 1 | 2;
  activeExerciseId: string;
  hydrated: boolean;
  syncError: string | null;
  hydrateAccount: () => Promise<void>;
  addSet: (input: {
    exerciseId: string;
    weightKg: number;
    reps: number;
    performedOn: string;
    at?: number;
  }) => string;
  updateSet: (id: string, patch: { weightKg: number; reps: number; performedOn: string }) => void;
  deleteSet: (id: string) => void;
  restoreSet: (set: LiftSet) => void;
  addExercise: (name: string) => string | null;
  renameExercise: (id: string, name: string) => void;
  removeExercise: (id: string) => void;
  setUnit: (unit: Unit) => void;
  setStepIndex: (stepIndex: 0 | 1 | 2) => void;
  setActiveExercise: (id: string) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useGym = create<GymState>()((set, get) => ({
  exercises: [],
  sets: [],
  unit: "kg",
  stepIndex: 1,
  activeExerciseId: "",
  hydrated: false,
  syncError: null,
  hydrateAccount: async () => {
    const prefs = readPrefs();
      set({
        ...prefs,
        syncError: null,
      });
    try {
      let data = await loadLog();
      if (data.exercises.length === 0 && data.sets.length === 0) {
        await pushLegacy();
        data = await loadLog();
      }
      const active = get().activeExerciseId;
      const activeExerciseId = data.exercises.some((item) => item.id === active)
        ? active
        : (data.exercises[0]?.id ?? "");
      set({
        exercises: data.exercises,
        sets: data.sets,
        activeExerciseId,
        hydrated: true,
        syncError: null,
      });
    } catch {
      set({ hydrated: true, syncError: "Could not sync. Try again in a moment." });
    }
  },
  addSet: ({ exerciseId, weightKg, reps, performedOn, at }) => {
    const id = crypto.randomUUID();
    const entry: LiftSet = {
      id,
      exerciseId,
      weightKg,
      reps,
      performedOn,
      at: at ?? Date.now(),
    };
    set({ sets: [...get().sets, entry], syncError: null });
    void saveSet({ data: entry }).then((result) => {
      if (!result.ok) throw new Error("rejected");
    }).catch(() => {
      set({
        sets: get().sets.filter((item) => item.id !== id),
        syncError: "That set did not sync.",
      });
    });
    return id;
  },
  updateSet: (id, patch) => {
    const previous = get().sets;
    set({
      sets: previous.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      syncError: null,
    });
    const next = get().sets.find((entry) => entry.id === id);
    if (!next) return;
    void saveSet({ data: next }).then((result) => {
      if (!result.ok) throw new Error("rejected");
    }).catch(() => set({ sets: previous, syncError: "That edit did not sync." }));
  },
  deleteSet: (id) => {
    const previous = get().sets;
    set({ sets: previous.filter((entry) => entry.id !== id), syncError: null });
    void removeSet({ data: id }).then((result) => {
      if (!result.ok) throw new Error("rejected");
    }).catch(() => set({ sets: previous, syncError: "Could not remove that set." }));
  },
  restoreSet: (entry) => {
    if (get().sets.some((item) => item.id === entry.id)) return;
    set({ sets: [...get().sets, entry].sort((a, b) => a.at - b.at) });
    void saveSet({ data: entry }).then((result) => {
      if (!result.ok) throw new Error("rejected");
    }).catch(() => {
      set({
        sets: get().sets.filter((item) => item.id !== entry.id),
        syncError: "Could not restore that set.",
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
      exercises: [...previousExercises, { id, name: trimmed }],
      activeExerciseId: id,
      syncError: null,
    });
    void saveExercise({ data: { id, name: trimmed } })
      .then((result) => {
        if (!result.ok) throw new Error("rejected");
        if (result.id === id) return;
        const hasServer = get().exercises.some((item) => item.id === result.id);
        set({
          exercises: hasServer
            ? get().exercises.filter((item) => item.id !== id)
            : get().exercises.map((item) => (item.id === id ? { id: result.id, name: trimmed } : item)),
          activeExerciseId: get().activeExerciseId === id ? result.id : get().activeExerciseId,
        });
      })
      .catch(() => {
        set({
          exercises: previousExercises,
          activeExerciseId: previousActive,
          syncError: "Could not save that exercise.",
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
      exercises: previous.map((exercise) => (exercise.id === id ? { ...exercise, name: trimmed } : exercise)),
      syncError: null,
    });
    void renameExerciseRemote({ data: { id, name: trimmed } }).then((result) => {
      if (!result.ok) throw new Error("rejected");
    }).catch(() =>
      set({ exercises: previous, syncError: "Could not rename that exercise." }),
    );
  },
  removeExercise: (id) => {
    if (get().sets.some((entry) => entry.exerciseId === id)) return;
    const previous = get().exercises;
    const previousActive = get().activeExerciseId;
    const exercises = previous.filter((exercise) => exercise.id !== id);
    const activeExerciseId = previousActive === id ? (exercises[0]?.id ?? "") : previousActive;
    set({ exercises, activeExerciseId, syncError: null });
    void deleteExerciseRemote({ data: id }).then((result) => {
      if (!result.ok) throw new Error("rejected");
    }).catch(() =>
      set({ exercises: previous, activeExerciseId: previousActive, syncError: "Could not remove that exercise." }),
    );
  },
  setUnit: (unit) => {
    set({ unit });
    writePrefs({ unit, stepIndex: get().stepIndex });
  },
  setStepIndex: (stepIndex) => {
    set({ stepIndex });
    writePrefs({ unit: get().unit, stepIndex });
  },
  setActiveExercise: (id) => set({ activeExerciseId: id }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
