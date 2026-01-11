import { type ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-[#0b1530]">

            {children}
        </div>
    );
}