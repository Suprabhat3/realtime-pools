import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthProvider";
import { getSession } from "../lib/auth-api";

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        await refreshSession();
        const session = await getSession();
        if (session.data.authenticated) {
          navigate("/dashboard", { replace: true });
          return;
        }
        navigate("/signin?error=session_missing", { replace: true });
      } catch {
        setError(true);
      }
    };

    void run();
  }, [navigate, refreshSession]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-cream text-brand-charcoal">
        <p className="text-sm font-semibold text-red-600">
          Sign-in completed, but we could not load your session.
        </p>
        <a
          href="/dashboard"
          className="text-sm font-bold text-brand-crimson underline hover:text-brand-crimson-hover"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream text-brand-charcoal">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-crimson border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Finalizing sign-in...</p>
      </div>
    </div>
  );
};

export default AuthSuccessPage;
