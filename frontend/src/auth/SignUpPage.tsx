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
