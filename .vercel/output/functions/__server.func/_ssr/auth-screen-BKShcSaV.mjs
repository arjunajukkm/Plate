import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-1vAx-gM_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-screen-BKShcSaV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
function PlateMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className,
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "16",
			cy: "16",
			r: "13",
			className: "fill-accent"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "16",
			cy: "16",
			r: "5",
			className: "fill-bg"
		})]
	});
}
var SESSION_TOKEN_KEY = "grok-auth.bearer-token";
function rememberToken(token) {
	if (!token) return;
	try {
		sessionStorage.setItem(SESSION_TOKEN_KEY, token);
	} catch {}
}
function friendly(error, fallback) {
	const code = error?.code ?? "";
	const message = (error?.message ?? "").toLowerCase();
	if (code.includes("USER_ALREADY_EXISTS") || message.includes("already")) return "That email already has an account. Sign in instead.";
	if (code.includes("INVALID_EMAIL_OR_PASSWORD") || message.includes("invalid email or password")) return "Email or password does not match.";
	if (code.includes("PASSWORD_TOO_SHORT") || message.includes("too short") || message.includes("at least")) return "Use at least 8 characters.";
	if (message.includes("invalid origin")) return "This browser blocked sign-in. Try email, or open the preview again.";
	if (message.includes("pop-up") || message.includes("popup")) return "Pop-up blocked. Allow pop-ups for Google, or use email.";
	return error?.message || fallback;
}
function AuthScreen() {
	const [mode, setMode] = (0, import_react.useState)("in");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(null);
	function switchMode(next) {
		setMode(next);
		setError(null);
	}
	async function finish(token) {
		rememberToken(token);
		try {
			if ((await authClient.getSession()).data?.user) return;
		} catch {}
		throw new Error("That account exists, but this browser did not keep the session. Try again.");
	}
	async function onSubmit(event) {
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
			let fromHeader = null;
			const fetchOptions = { onSuccess(ctx) {
				fromHeader = ctx.response.headers.get("set-auth-token");
				rememberToken(fromHeader);
			} };
			const result = mode === "up" ? await authClient.signUp.email({
				name: trimmedName,
				email: trimmedEmail,
				password,
				callbackURL: "/",
				fetchOptions
			}) : await authClient.signIn.email({
				email: trimmedEmail,
				password,
				callbackURL: "/",
				rememberMe: true,
				fetchOptions
			});
			if (result.error) {
				setError(friendly(result.error, mode === "up" ? "Could not create the account." : "Could not sign in."));
				setBusy(null);
				return;
			}
			const token = result.data?.token;
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
			errorCallbackURL: "/"
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
			if (/pop-up|popup|cancelled|canceled/i.test(message)) try {
				await redirectToGoogle();
				return;
			} catch (redirectErr) {
				const redirectMessage = redirectErr instanceof Error ? redirectErr.message : message;
				setError(friendly({ message: redirectMessage }, "Google sign-in failed."));
				setBusy(null);
				return;
			}
			setError(friendly({ message }, "Google sign-in failed."));
			setBusy(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "app-wash min-h-dvh px-6 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-sm py-10 pt-safe pb-safe",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateMark, { className: "size-12" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 text-3xl font-medium tracking-tight",
					children: "Plate"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-normal text-muted",
					children: "Sign in or create an account. Your exercises and sets stay with you."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid grid-cols-2 rounded-md bg-surface p-1",
					role: "group",
					"aria-label": "Account",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": mode === "in",
						className: `focus-ring tap h-11 rounded-sm text-sm font-medium ${mode === "in" ? "bg-accent text-accent-fg" : "text-muted"}`,
						onClick: () => switchMode("in"),
						children: "Sign in"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": mode === "up",
						className: `focus-ring tap h-11 rounded-sm text-sm font-medium ${mode === "up" ? "bg-accent text-accent-fg" : "text-muted"}`,
						onClick: () => switchMode("up"),
						children: "Sign up"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 flex flex-col gap-3",
					noValidate: true,
					onSubmit,
					children: [
						mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							htmlFor: "account-name",
							className: "text-sm text-subtle",
							children: "Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "account-name",
							value: name,
							onChange: (event) => setName(event.target.value),
							autoComplete: "name",
							maxLength: 80,
							className: "focus-ring mt-1 h-12 w-full rounded-sm bg-surface px-3 text-base text-fg"
						})] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							htmlFor: "account-email",
							className: "text-sm text-subtle",
							children: "Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "account-email",
							type: "email",
							value: email,
							onChange: (event) => setEmail(event.target.value),
							autoComplete: "email",
							inputMode: "email",
							required: false,
							className: "focus-ring mt-1 h-12 w-full rounded-sm bg-surface px-3 text-base text-fg"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "account-password",
								className: "text-sm text-subtle",
								children: "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "focus-ring tap text-sm text-muted",
								onClick: () => setShowPassword((value) => !value),
								children: showPassword ? "Hide" : "Show"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "account-password",
							type: showPassword ? "text" : "password",
							value: password,
							onChange: (event) => setPassword(event.target.value),
							autoComplete: mode === "up" ? "new-password" : "current-password",
							className: "focus-ring mt-1 h-12 w-full rounded-sm bg-surface px-3 text-base text-fg"
						})] }),
						mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							htmlFor: "account-confirm",
							className: "text-sm text-subtle",
							children: "Confirm password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "account-confirm",
							type: showPassword ? "text" : "password",
							value: confirm,
							onChange: (event) => setConfirm(event.target.value),
							autoComplete: "new-password",
							className: "focus-ring mt-1 h-12 w-full rounded-sm bg-surface px-3 text-base text-fg"
						})] }) : null,
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-fg",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy !== null,
							className: "focus-ring tap mt-1 h-14 rounded-md bg-accent text-base font-medium text-accent-fg disabled:opacity-40",
							children: busy === "form" ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "my-5 flex items-center gap-3 text-xs text-subtle",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-line" }),
						"or",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-line" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: busy !== null,
					className: "focus-ring tap h-14 w-full rounded-md bg-surface text-base font-medium text-fg disabled:opacity-40",
					onClick: () => void onGoogle(),
					children: busy === "google" ? "Opening Google…" : "Continue with Google"
				})
			]
		})
	});
}
//#endregion
export { useCurrentUserState as i, PlateMark as n, useCurrentUser as r, AuthScreen as t };
