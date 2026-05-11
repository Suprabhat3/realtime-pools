import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthProvider";

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const run = async () => {
      await refreshSession();
      navigate("/", { replace: true });
    };

    void run();
  }, [navigate, refreshSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream text-brand-charcoal">
      <p className="text-sm font-semibold">Finalizing sign-in...</p>
    </div>
  );
};

export default AuthSuccessPage;
