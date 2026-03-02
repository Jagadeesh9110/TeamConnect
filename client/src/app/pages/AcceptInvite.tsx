import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import TeamConnectLogo from "../components/TeamConnectLogo";
import { validateInvite, acceptInvite } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { CheckCircle, XCircle, Loader2, LogIn } from "lucide-react";

type Status = "loading" | "needsAuth" | "accepting" | "success" | "error";

export default function AcceptInvitePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const currentUser = useAuthStore((s) => s.user);

    const [status, setStatus] = useState<Status>("loading");
    const [message, setMessage] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No invite token provided.");
            return;
        }

        const run = async () => {
            try {
                // Step 1: Validate the token (public endpoint)
                const result = await validateInvite(token);
                setWorkspaceName(result.workspaceName);

                if (result.accepted) {
                    setStatus("error");
                    setMessage("This invite has already been used.");
                    return;
                }

                if (result.expired || !result.valid) {
                    setStatus("error");
                    setMessage("This invite link has expired.");
                    return;
                }

                // Step 2: If not logged in, save token and redirect
                if (!isAuthenticated) {
                    localStorage.setItem(
                        "pendingInviteToken",
                        JSON.stringify({ token, workspaceName: result.workspaceName })
                    );
                    setStatus("needsAuth");
                    return;
                }

                // Step 3: Accept the invite
                setStatus("accepting");
                const acceptResult = await acceptInvite(token);
                setWorkspaceName(acceptResult.workspaceName);
                setStatus("success");
                setMessage(acceptResult.message);

                // Clear any stored token
                localStorage.removeItem("pendingInviteToken");
            } catch (err: any) {
                setStatus("error");
                setMessage(
                    err?.response?.data?.error || err.message || "Failed to process invite"
                );
            }
        };

        run();
    }, [token, isAuthenticated]);

    const goToLogin = () => {
        navigate("/login");
    };

    const goToRegister = () => {
        navigate("/register");
    };

    const goToApp = () => {
        localStorage.removeItem("pendingInviteToken");
        navigate("/app");
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-[420px] p-8 md:p-10 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <TeamConnectLogo className="w-16 h-16 text-white mb-6 opacity-90 drop-shadow-lg" />
                    <h1 className="text-2xl font-medium text-white tracking-tight">
                        Workspace Invite
                    </h1>
                    {workspaceName && (
                        <p className="text-blue-400 text-sm mt-1 font-medium">
                            {workspaceName}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Loading / Validating */}
                    {status === "loading" && (
                        <>
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                            <p className="text-slate-300">Validating invite…</p>
                        </>
                    )}

                    {/* Accepting */}
                    {status === "accepting" && (
                        <>
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                            <p className="text-slate-300">Joining workspace…</p>
                        </>
                    )}

                    {/* Needs auth — not logged in */}
                    {status === "needsAuth" && (
                        <>
                            <LogIn className="w-14 h-14 text-amber-400" />
                            <p className="text-white font-medium text-lg">
                                Sign in to accept your invite
                            </p>
                            <p className="text-slate-400 text-sm">
                                You've been invited to <span className="text-blue-400 font-medium">{workspaceName}</span>.
                                Log in or create an account to join.
                            </p>
                            <div className="flex flex-col gap-3 w-full pt-2">
                                <button
                                    onClick={goToLogin}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-300 transform active:scale-[0.98]"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={goToRegister}
                                    className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 hover:text-white font-medium rounded-xl hover:bg-white/10 transition-all duration-300"
                                >
                                    Create Account
                                </button>
                            </div>
                        </>
                    )}

                    {/* Success */}
                    {status === "success" && (
                        <>
                            <CheckCircle className="w-14 h-14 text-emerald-400" />
                            <p className="text-emerald-400 font-medium text-lg">{message}</p>
                            {currentUser && (
                                <p className="text-slate-400 text-sm">
                                    Signed in as <span className="text-white">{currentUser.email}</span>
                                </p>
                            )}
                            <button
                                onClick={goToApp}
                                className="mt-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-300 transform active:scale-[0.98]"
                            >
                                Open TeamConnect
                            </button>
                        </>
                    )}

                    {/* Error */}
                    {status === "error" && (
                        <>
                            <XCircle className="w-14 h-14 text-red-400" />
                            <p className="text-red-400 font-medium">{message}</p>
                            <button
                                onClick={() => navigate("/login")}
                                className="mt-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-300 transform active:scale-[0.98]"
                            >
                                Go to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}
