import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BackgroundElements from "../components/BackgroundElements";
import Header from "../components/Header";
import { useAuth } from "./AuthProvider";
import { signInWithEmail, signInWithGoogle, signUpWithEmail, verifyEmailCode } from "../lib/auth-api";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"details" | "verify">("details");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await signUpWithEmail(name, email, password);
      setInfoMessage(result.message);
      setStep("verify");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign up";
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
      navigate("/");
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-crimson">Get started</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Create your ZenPoll account</h1>
          <p className="mt-2 text-sm text-gray-600">Start creating polls and collect insights in real time.</p>

          {step === "details" ? (
            <>
              <form className="mt-8 space-y-4" onSubmit={onSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Full name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                    placeholder="Your name"
                    required
                    autoComplete="name"
                  />
                </label>

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
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                    placeholder="Repeat password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </label>

                {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
                {infoMessage ? <p className="text-sm text-emerald-700">{infoMessage}</p> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-crimson px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-crimson-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Sending code..." : "Create account"}
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
                className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
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
                {isSubmitting ? "Verifying..." : "Verify and continue"}
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

          <p className="mt-6 text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/signin" className="font-bold text-brand-crimson hover:text-brand-crimson-hover">
              Sign in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default SignUpPage;
