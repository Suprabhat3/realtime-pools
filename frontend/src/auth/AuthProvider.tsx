import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getSession, signOut } from "../lib/auth-api";
import type { SessionUser } from "../lib/auth-api";

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: SessionUser | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const refreshSession = async () => {
    try {
      const session = await getSession();
      setIsAuthenticated(session.data.authenticated);
      setUser(session.data.user);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      refreshSession,
      signOut: handleSignOut
    }),
    [isLoading, isAuthenticated, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
