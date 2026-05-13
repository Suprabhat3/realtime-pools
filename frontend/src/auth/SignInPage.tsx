import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import BackgroundElements from "../components/BackgroundElements";
import Header from "../components/Header";
import { useAuth } from "./AuthProvider";
import { signInWithEmail, signInWithGoogle, verifyEmailCode } from "../lib/auth-api";

const SignInPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"credentials" | "verify">("credentials");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await signInWithEmail(email, password);
      setInfoMessage(result.message);
      setStep("verify");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      await verifyEmailCode(email, code);
      await refreshSession();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to verify code";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await signInWithEmail(email, password);
      setInfoMessage(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to resend code";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogle = () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    signInWithGoogle();
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <BackgroundElements />
      <Header />
      <main className="relative z-10 flex grow items-center justify-center px-4 py-10">
        <section className="w-full max-w-md border border-gray-200 bg-white/85 backdrop-blur-sm p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-crimson">Welcome back</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Sign in to ZenPoll</h1>
          <p className="mt-2 text-sm text-gray-600">Access your polls, responses, and live analytics.</p>

          {step === "credentials" ? (
            <>
              <form className="mt-8 space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                  />
                </label>

                {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
                {infoMessage ? <p className="text-sm text-emerald-700">{infoMessage}</p> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-crimson px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-crimson-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Sending code..." : "Continue"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-gray-500">
                <div className="h-px flex-1 bg-gray-200" />
                <span>OR</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={onGoogle}
                disabled={isSubmitting}
                className="w-full border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Continue with Google
              </button>
            </>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={onVerify}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Verification code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="w-full border border-gray-300 bg-white px-3 py-2.5 text-center text-lg tracking-[0.4em] outline-none focus:border-brand-crimson"
                  placeholder="000000"
                  required
                />
              </label>

              {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
              {infoMessage ? <p className="text-sm text-emerald-700">{infoMessage}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-crimson px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-crimson-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Verifying..." : "Verify and sign in"}
              </button>

              <button
                type="button"
                onClick={onResend}
                disabled={isSubmitting}
                className="w-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Resend code
              </button>
            </form>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <Link to="/forgot-password" className="font-bold text-brand-crimson hover:text-brand-crimson-hover">
              Forgot password?
            </Link>
            <span>
              New here?{" "}
              <Link to="/signup" className="font-bold text-brand-crimson hover:text-brand-crimson-hover">
                Create an account
              </Link>
            </span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SignInPage;
