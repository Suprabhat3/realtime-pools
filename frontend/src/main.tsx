import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./index.css";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import AuthSuccessPage from "./auth/AuthSuccessPage";
import ForgotPasswordPage from "./auth/ForgotPasswordPage";
import SignInPage from "./auth/SignInPage";
import SignUpPage from "./auth/SignUpPage";
import ResetPasswordPage from "./auth/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth/success" element={<AuthSuccessPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
