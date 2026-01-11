import { useState } from "react";
import AuthLayout from "../layout/AuthLayout";
import TeamConnectLogo from "../components/TeamConnectLogo";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg bg-[#020617]/60 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />

                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg bg-[#020617]/60 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg bg-[#020617]/60 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />

                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg bg-[#020617]/60 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    />

                    <button
                        className="
              w-full rounded-lg
              bg-gradient-to-b from-blue-600 to-blue-700
              hover:from-blue-700 hover:to-blue-800
              transition-colors
              py-3
              text-white font-medium
              shadow-lg shadow-blue-900/40
            "
                    >
                        Create Account
                    </button>
                </div>

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