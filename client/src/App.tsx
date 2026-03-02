import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./app/pages/Login";
import RegisterPage from "./app/pages/Register";
import VerifyEmailPage from "./app/pages/VerifyEmail";
import AcceptInvitePage from "./app/pages/AcceptInvite";
import LandingPage from "./app/pages/LandingPage";
import ProtectedRoute from "./app/pages/ProtectedRoute";
import ChatLayout from "./app/chart/ChatLayout";
import { useAuthInit } from "./hooks/useAuthInit";
import { useAuthStore } from "./store/authStore";

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route
                path="/app"
                element={
                    <ProtectedRoute>
                        <ChatLayout />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    // Initialize auth state on app mount
    useAuthInit();

    const { isLoading } = useAuthStore();

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-navy-900">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className="mt-4 text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;