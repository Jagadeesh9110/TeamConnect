import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import TeamConnectLogo from "../components/TeamConnectLogo";
import { verifyEmail } from "../../lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token provided.");
            return;
        }

        const verify = async () => {
            try {
                const result = await verifyEmail(token);
                setStatus("success");
                setMessage(result.message);
            } catch (err: any) {
                setStatus("error");
                setMessage(err.message || "Verification failed. The link may be expired or invalid.");
            }
        };

        verify();
    }, [token]);

    return (
        <AuthLayout>
            <div className="w-full max-w-[420px] p-8 md:p-10 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <TeamConnectLogo className="w-16 h-16 text-white mb-6 opacity-90 drop-shadow-lg" />
                    <h1 className="text-2xl font-medium text-white tracking-tight">
                        Email Verification
                    </h1>
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                    {status === "loading" && (
                        <>
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                            <p className="text-slate-300">Verifying your email…</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle className="w-14 h-14 text-emerald-400" />
                            <p className="text-emerald-400 font-medium text-lg">{message}</p>
                            <button
                                onClick={() => navigate("/login")}
                                className="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.6)] transition-all duration-300 transform active:scale-[0.98]"
                            >
                                Continue to Login
                            </button>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="w-14 h-14 text-red-400" />
                            <p className="text-red-400 font-medium">{message}</p>
                            <div className="flex flex-col gap-3 w-full mt-4">
                                <button
                                    onClick={() => navigate("/login")}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-300 transform active:scale-[0.98]"
                                >
                                    Go to Login
                                </button>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 hover:text-white font-medium rounded-xl hover:bg-white/10 transition-all duration-300"
                                >
                                    Create New Account
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}
