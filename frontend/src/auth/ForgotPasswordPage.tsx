import { useState } from "react";
import { Link } from "react-router-dom";

import BackgroundElements from "../components/BackgroundElements";
import Header from "../components/Header";
import { requestPasswordReset } from "../lib/auth-api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await requestPasswordReset(email);
      setInfoMessage(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to request reset";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <BackgroundElements />
      <Header />
      <main className="relative z-10 flex grow items-center justify-center px-4 py-10">
        <section className="w-full max-w-md border border-gray-200 bg-white/85 backdrop-blur-sm p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-crimson">Reset access</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Forgot your password?</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we will send you a reset link.
          </p>

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

            {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
            {infoMessage ? <p className="text-sm text-emerald-700">{infoMessage}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-crimson px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-crimson-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Remembered your password?{" "}
            <Link to="/signin" className="font-bold text-brand-crimson hover:text-brand-crimson-hover">
              Sign in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
