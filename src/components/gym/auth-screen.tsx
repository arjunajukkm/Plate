import { useState, type FormEvent } from "react";
import { authClient, signIn } from "@/lib/auth/client";
import { PlateMark } from "@/components/gym/plate-mark";

const SESSION_TOKEN_KEY = "grok-auth.bearer-token";

type Mode = "in" | "up";

function rememberToken(token: string | null | undefined) {
  if (!token) return;
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

function friendly(error: { message?: string; code?: string } | null, fallback: string): string {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();
  if (code.includes("USER_ALREADY_EXISTS") || message.includes("already")) {
    return "That email already has an account. Sign in instead.";
  }
  if (code.includes("INVALID_EMAIL_OR_PASSWORD") || message.includes("invalid email or password")) {
    return "Email or password does not match.";
  }
  if (code.includes("PASSWORD_TOO_SHORT") || message.includes("too short") || message.includes("at least")) {
    return "Use at least 8 characters.";
  }
  if (message.includes("invalid origin")) {
    return "This browser blocked sign-in. Try email, or open the preview again.";
  }
  if (message.includes("pop-up") || message.includes("popup")) {
    return "Pop-up blocked. Allow pop-ups for Google, or use email.";
  }
  return error?.message || fallback;
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"form" | "google" | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function finish(token?: string | null) {
    rememberToken(token);
    try {
      const session = await authClient.getSession();
      if (session.data?.user) return;
    } catch {
      /* fall through */
    }
    throw new Error("That account exists, but this browser did not keep the session. Try again.");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim().replace(/\s+/g, " ");
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (mode === "up") {
      if (!trimmedName) {
        setError("Add your name.");
        return;
      }
      if (password !== confirm) {
        setError("Those passwords do not match.");
        return;
      }
    }
    setError(null);
    setBusy("form");
    try {
      let fromHeader: string | null = null;
      const fetchOptions = {
        onSuccess(ctx: { response: Response }) {
          fromHeader = ctx.response.headers.get("set-auth-token");
          rememberToken(fromHeader);
        },
      };
      const result =
        mode === "up"
          ? await authClient.signUp.email({
              name: trimmedName,
              email: trimmedEmail,
              password,
              callbackURL: "/",
              fetchOptions,
            })
          : await authClient.signIn.email({
              email: trimmedEmail,
              password,
              callbackURL: "/",
              rememberMe: true,
              fetchOptions,
            });
      if (result.error) {
        setError(friendly(result.error, mode === "up" ? "Could not create the account." : "Could not sign in."));
        setBusy(null);
        return;
      }
      const token = (result.data as { token?: string } | null)?.token;
      await finish(fromHeader ? null : token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not sign in.";
      setError(friendly({ message }, "Could not sign in."));
      setBusy(null);
    }
  }

  function phoneBrowser() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  async function redirectToGoogle() {
    const { data, error } = await authClient.signIn.oauth2({
      providerId: "grok-google",
      callbackURL: "/auth/popup?done=1",
      errorCallbackURL: "/",
    });
    if (error) throw new Error(error.message || "Google sign-in failed");
    if (!data?.url) throw new Error("Google sign-in did not start.");
    window.location.assign(data.url);
  }

  async function onGoogle() {
    if (busy) return;
    setError(null);
    setBusy("google");
    try {
      if (phoneBrowser()) {
        await redirectToGoogle();
        return;
      }
      await signIn("grok-google", { callbackURL: "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      const blocked = /pop-up|popup|cancelled|canceled/i.test(message);
      if (blocked) {
        try {
          await redirectToGoogle();
          return;
        } catch (redirectErr) {
          const redirectMessage = redirectErr instanceof Error ? redirectErr.message : message;
          setError(friendly({ message: redirectMessage }, "Google sign-in failed."));
          setBusy(null);
          return;
        }
      }
      setError(friendly({ message }, "Google sign-in failed."));
      setBusy(null);
    }
  }

  return (
    <main className="app-wash min-h-dvh px-6 text-fg">
      <div className="mx-auto w-full max-w-sm py-10 pt-safe pb-safe">
        <PlateMark className="size-12" />
        <h1 className="mt-4 text-3xl font-medium tracking-tight">Plate</h1>
        <p className="mt-2 text-sm leading-normal text-muted">
          Sign in or create an account. Your exercises and sets stay with you.
        </p>

        <div className="mt-8 grid grid-cols-2 rounded-md bg-surface p-1" role="group" aria-label="Account">
          <button
            type="button"
            aria-pressed={mode === "in"}
            className={`focus-ring tap h-11 rounded-sm text-sm font-medium ${mode === "in" ? "bg-accent text-accent-fg" : "text-muted"}`}
            onClick={() => switchMode("in")}
          >
            Sign in
          </button>
          <button
            type="button"
            aria-pressed={mode === "up"}
            className={`focus-ring tap h-11 rounded-sm text-sm font-medium ${mode === "up" ? "bg-accent text-accent-fg" : "text-muted"}`}
            onClick={() => switchMode("up")}
          >
            Sign up
          </button>
        </div>

        <form className="mt-4 flex flex-col gap-3" noValidate onSubmit={onSubmit}>
          {mode === "up" ? (
            <div>
              <label htmlFor="account-name" className="text-sm text-subtle">
                Name
              </label>
              <input
                id="account-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={80}
                className="focus-ring mt-1 h-12 w-full rounded-sm bg-surface px-3 text-base text-fg"
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="account-email" className="text-sm text-subtle">
              Email
            </label>
            <input
              id="account-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              required={false}
              className="focus-ring mt-1 h-12 w-full rounded-sm bg-surface px-3 text-base text-fg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="account-password" className="text-sm text-subtle">
                Password
              </label>
              <button
                type="button"
                className="focus-ring tap text-sm text-muted"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="account-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              className="focus-ring mt-1 h-12 w-full rounded-sm bg-surface px-3 text-base text-fg"
            />
          </div>
          {mode === "up" ? (
            <div>
              <label htmlFor="account-confirm" className="text-sm text-subtle">
                Confirm password
              </label>
              <input
                id="account-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                className="focus-ring mt-1 h-12 w-full rounded-sm bg-surface px-3 text-base text-fg"
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-fg">{error}</p> : null}
          <button
            type="submit"
            disabled={busy !== null}
            className="focus-ring tap mt-1 h-14 rounded-md bg-accent text-base font-medium text-accent-fg disabled:opacity-40"
          >
            {busy === "form" ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-subtle">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          disabled={busy !== null}
          className="focus-ring tap h-14 w-full rounded-md bg-surface text-base font-medium text-fg disabled:opacity-40"
          onClick={() => void onGoogle()}
        >
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>
      </div>
    </main>
  );
}
