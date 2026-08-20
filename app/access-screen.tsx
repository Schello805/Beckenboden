"use client";
/* eslint-disable @next/next/no-img-element */
import { FormEvent, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { PasswordRequest } from "./password-request";

export type AuthUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  firstName: string;
  lastName: string;
  twoFactorEnabled?: boolean;
  profileImage?: boolean;
  avatarRevision?: number;
};

export function AccessScreen({
  setupRequired,
  onSuccess,
}: {
  setupRequired: boolean;
  onSuccess: (user: AuthUser) => void;
}) {
  const invitedCode =
    typeof window !== "undefined"
      ? new URLSearchParams(new URL(window.location.href).hash.slice(1)).get(
          "code",
        ) || ""
      : "";
  const [mode, setMode] = useState<"login" | "register" | "setup">(
      setupRequired ? "setup" : "register",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [needsTwoFactor, setNeedsTwoFactor] = useState(false),
    [twoFactorMethod, setTwoFactorMethod] = useState("totp"),
    [registerStep, setRegisterStep] = useState<1 | 2>(1),
    [accessCode, setAccessCode] = useState(invitedCode),
    [courseTitle, setCourseTitle] = useState("");
  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
    setRegisterStep(1);
    setAccessCode("");
    setCourseTitle("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget),
      body = Object.fromEntries(form.entries());
    if (mode === "register" && registerStep === 1) {
      const response = await fetch("/api/auth/register/code", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: body.code }),
        }),
        result = await response
          .json()
          .catch(() => ({ error: "Der Code konnte nicht geprüft werden." }));
      setBusy(false);
      if (!response.ok) {
        setError(result.error);
        return;
      }
      setAccessCode(String(body.code));
      setCourseTitle(result.courseTitle || "deinen Kurs");
      setRegisterStep(2);
      if (location.hash.startsWith("#code="))
        history.replaceState({}, "", `${location.pathname}${location.search}`);
      return;
    }
    if (mode === "register") body.code = accessCode;
    const endpoint =
      mode === "setup"
        ? "/api/setup/initialize"
        : mode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";
    let response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      result = await response
        .json()
        .catch(() => ({ error: "Unbekannter Fehler." }));
    if (
      result.requiresTwoFactor &&
      result.twoFactorMethod === "passkey" &&
      result.passkeyOptions
    )
      try {
        const passkeyResponse = await startAuthentication({
          optionsJSON: result.passkeyOptions,
        });
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...body, passkeyResponse }),
        });
        result = await response.json();
      } catch (error) {
        setBusy(false);
        setNeedsTwoFactor(true);
        setTwoFactorMethod("passkey");
        setError(
          `${error instanceof Error ? error.message : "Passkey-Anmeldung abgebrochen."} Du kannst stattdessen einen Wiederherstellungscode eingeben.`,
        );
        return;
      }
    setBusy(false);
    if (result.requiresTwoFactor) {
      setNeedsTwoFactor(true);
      setTwoFactorMethod(result.twoFactorMethod || "totp");
      if (!response.ok) setError(result.error || "");
      return;
    }
    if (!response.ok) {
      setError(result.error || "Das hat leider nicht geklappt.");
      return;
    }
    const me = await fetch("/api/me").then((r) => r.json());
    onSuccess(me.user);
  }
  const registering = mode === "register",
    codeStep = registering && registerStep === 1;
  return (
    <main className="access-page">
      <section className="access-story">
        <div className="access-brand">
          <img className="brand-logo" src="/logo-kraftbaum.svg" alt="" />
          <span>
            <b>STÄRKE DEINE MITTE</b>
            <small>ANJA SCHELLENBERGER</small>
          </span>
        </div>
        <div className="access-message">
          <p className="eyebrow">Stärke deine Mitte</p>
          <h1>
            Deine Kraft
            <br />
            <em>wächst mit dir.</em>
          </h1>
          <p>
            Deine persönliche Begleitung für Beckenboden, Kraft und Zeit für
            dich.
          </p>
        </div>
        <img className="access-watermark" src="/logo-kraftbaum.svg" alt="" />
      </section>
      <section className="access-form">
        <div>
          <p className="eyebrow">
            {mode === "setup"
              ? "Einmalige Einrichtung"
              : mode === "login"
                ? "Willkommen zurück"
                : `Schritt ${registerStep} von 2`}
          </p>
          <h2>
            {mode === "setup"
              ? "Ersten Admin anlegen"
              : mode === "login"
                ? "Anmelden"
                : codeStep
                  ? "Kurscode eingeben"
                  : "Konto erstellen"}
          </h2>
          <p>
            {codeStep
              ? "Gib zuerst nur den Zugangscode aus deiner Kursbuchung ein."
              : registering
                ? `${courseTitle} ist bereit. Jetzt fehlen nur noch deine Kontodaten.`
                : mode === "login"
                  ? "Schön, dass du wieder da bist."
                  : "Diese Seite ist nur verfügbar, solange noch kein Admin existiert."}
          </p>
          {registering && (
            <div
              className="wizard-progress"
              aria-label={`Registrierung, Schritt ${registerStep} von 2`}
            >
              <i className="active" />
              <i className={registerStep === 2 ? "active" : ""} />
            </div>
          )}
          <form onSubmit={submit}>
            {mode === "setup" && (
              <>
                <label>
                  Installationsschlüssel
                  <input
                    name="installToken"
                    type="password"
                    required
                    minLength={16}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Vorname
                    <input name="firstName" required autoComplete="given-name" />
                  </label>
                  <label>
                    Nachname
                    <input name="lastName" required autoComplete="family-name" />
                  </label>
                </div>
              </>
            )}
            {codeStep && (
              <label>
                Zugangscode
                <input
                  name="code"
                  defaultValue={invitedCode}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="ABCD-EFGH-1234"
                  required
                  minLength={8}
                />
              </label>
            )}
            {registering && registerStep === 2 && (
              <>
                <button
                  type="button"
                  className="wizard-code"
                  onClick={() => {
                    setRegisterStep(1);
                    setError("");
                  }}
                >
                  ✓ {accessCode} · Code ändern
                </button>
                <div className="form-row">
                  <label>
                    Vorname
                    <input
                      name="firstName"
                      required
                      autoComplete="given-name"
                    />
                  </label>
                  <label>
                    Nachname
                    <input
                      name="lastName"
                      required
                      autoComplete="family-name"
                    />
                  </label>
                </div>
              </>
            )}
            {!codeStep && (
              <>
                <label>
                  E-Mail-Adresse
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </label>
                <label>
                  Passwort{" "}
                  <small>{registering ? "mindestens 8 Zeichen" : ""}</small>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
              </>
            )}
            {mode === "login" && needsTwoFactor && (
              <label>
                Sicherheitscode{" "}
                <small>
                  {twoFactorMethod === "email"
                    ? "Code aus der E-Mail oder Wiederherstellungscode"
                    : "Authenticator- oder Wiederherstellungscode"}
                </small>
                <input
                  name="twoFactorCode"
                  required
                  autoComplete="one-time-code"
                />
              </label>
            )}
            {registering && registerStep === 2 && (
              <>
                <div className="form-row">
                  <label>
                    Geburtstag <small>optional</small>
                    <input name="birthday" type="date" />
                  </label>
                  <label>
                    Telefon <small>optional</small>
                    <input name="phone" type="tel" />
                  </label>
                </div>
                <label className="check">
                  <input name="terms" type="checkbox" required />{" "}
                  <span>
                    Ich akzeptiere die{" "}
                    <a
                      href="/rechtliches/nutzungsbedingungen"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Nutzungsbedingungen
                    </a>{" "}
                    und habe die{" "}
                    <a
                      href="/rechtliches/datenschutz"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Datenschutzerklärung
                    </a>{" "}
                    gelesen.
                  </span>
                </label>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary access-submit" disabled={busy}>
              {busy
                ? "Einen Moment …"
                : mode === "login"
                  ? "Anmelden"
                  : mode === "setup"
                    ? "Sicher einrichten"
                    : codeStep
                      ? "Code prüfen und weiter"
                      : "Konto erstellen & Kurs aktivieren"}
            </button>
          </form>
          {mode === "login" && <PasswordRequest />}
          {mode !== "setup" && (
            <button
              className="mode-switch"
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
            >
              {mode === "login"
                ? "Ich habe einen neuen Zugangscode"
                : "Ich habe bereits ein Konto"}
            </button>
          )}
          <footer className="access-legal">
            <a href="/rechtliches/impressum" target="_blank" rel="noreferrer">
              Impressum
            </a>
            <a href="/rechtliches/datenschutz" target="_blank" rel="noreferrer">
              Datenschutz
            </a>
          </footer>
        </div>
      </section>
    </main>
  );
}
