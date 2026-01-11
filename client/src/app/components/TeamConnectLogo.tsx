// TeamConnect Logo - Hexagonal TC mark matching reference image
// Interlocking T and C within a hexagonal border

export default function TeamConnectLogo({ className = "w-16 h-16" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Outer hexagon border */}
            <path
                d="M32 4L58 18V46L32 60L6 46V18L32 4Z"
                stroke="#94a3b8"
                strokeWidth="2"
                fill="none"
                strokeLinejoin="round"
            />

            {/* T - Horizontal top bar */}
            <path
                d="M18 20H46"
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* T - Vertical stem */}
            <path
                d="M32 20V48"
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* C - Curved bracket shape interlocking with T */}
            <path
                d="M44 26C50 26 52 32 52 36C52 40 50 46 44 46"
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
            />

            {/* Inner hexagon accent (subtle) */}
            <path
                d="M32 10L52 21V43L32 54L12 43V21L32 10Z"
                stroke="#475569"
                strokeWidth="1"
                fill="none"
                strokeLinejoin="round"
                opacity="0.5"
            />
        </svg>
    );
}