import { useState } from "react";
import AuthLayout from "../layout/AuthLayout";
import TeamConnectLogo from "../components/TeamConnectLogo";

import { registerUser } from "../../lib/api";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
        const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
           const response = await registerUser(name, email, password);
           console.log("Registration successful:", response.message);

            navigate("/login");
            
        } catch (err: any) {
            console.error("Registration failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div
                className="
          w-full max-w-md
          rounded-2xl
          bg-[#1e293b]/80
          backdrop-blur-2xl
          border border-white/20
          shadow-[0_0_60px_rgba(15,23,42,0.9)]
          px-8 py-10
        "
            >
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <TeamConnectLogo className="w-12 h-12" />
                </div>

                <h1 className="text-center text-2xl font-semibold text-white mb-8">
                    Create your account
                </h1>

                {/* Error */}
                {error && (
                    <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="
                               w-full pl-11 pr-4 py-3.5
                               bg-navy-900/50
                               border border-white/10
                               rounded-xl
                               text-white
                               placeholder:text-slate-500
                               focus:outline-none focus:ring-2 focus:ring-blue-500/50
                               transition-all duration-300
                            "
                        />
                    </div>
                    {/* Email */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                        </div>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="
                               w-full pl-11 pr-4 py-3.5
                               bg-navy-900/50
                               border border-white/10
                               rounded-xl
                               text-white
                               placeholder:text-slate-500
                               focus:outline-none focus:ring-2 focus:ring-blue-500/50
                               transition-all duration-300
                            "
                        />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="
                               w-full pl-11 pr-12 py-3.5
                               bg-navy-900/50
                               border border-white/10
                               rounded-xl
                               text-white
                               placeholder:text-slate-500
                               focus:outline-none focus:ring-2 focus:ring-blue-500/50
                               transition-all duration-300
                            "
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>

                   {/* Confirm Password */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="
                          w-full pl-11 pr-4 py-3.5
                          bg-navy-900/50
                          border border-white/10
                          rounded-xl
                          text-white
                          placeholder:text-slate-500
                          focus:outline-none focus:ring-2 focus:ring-blue-500/50
                          transition-all duration-300
                        "
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="
                          w-full py-3.5 mt-2
                          bg-gradient-to-r from-blue-600 to-blue-700
                          hover:from-blue-500 hover:to-blue-600
                          text-white font-medium text-lg
                          rounded-xl
                          shadow-[0_4px_20px_rgba(37,99,235,0.4)]
                          hover:shadow-[0_6px_25px_rgba(37,99,235,0.6)]
                          transition-all duration-300
                          transform active:scale-[0.98]
                          disabled:opacity-60 disabled:cursor-not-allowed
                        "
                    >
                         {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-400 hover:underline">
                        Sign in
                    </a>
                </p>
            </div>
        </AuthLayout>
    );
}