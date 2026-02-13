import { Link } from "react-router-dom";
import {
    MessageSquare,
    Shield,
    Zap,
    Search,
    Bell,
    Clock,
    FolderOpen,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";
import TeamConnectLogo from "../components/TeamConnectLogo";

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-soft bg-primary-bg/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                {/* Logo + wordmark */}
                <Link to="/" className="flex items-center gap-2.5">
                    <TeamConnectLogo className="w-8 h-8" />
                    <span className="text-text-primary font-semibold text-lg tracking-tight">
                        TeamConnect
                    </span>
                </Link>

                {/* Nav links — hidden on mobile */}
                <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
                    <a href="#features" className="hover:text-text-primary transition-colors">
                        Features
                    </a>
                    <a href="#how-it-works" className="hover:text-text-primary transition-colors">
                        How it Works
                    </a>
                </div>

                {/* Auth buttons */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Log in
                    </Link>
                    <Link
                        to="/register"
                        className="text-sm px-4 py-2 rounded-lg bg-accent hover:bg-blue-600 text-white font-medium transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
    return (
        <section className="pt-36 pb-24 px-6 text-center">
            <div className="max-w-3xl mx-auto">
                <p className="text-accent text-sm font-medium tracking-wider uppercase mb-4">
                    Team messaging, reimagined
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight">
                    Focus on what matters.{" "}
                    <span className="text-text-secondary">Let the noise fade away.</span>
                </h1>
                <p className="mt-6 text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
                    TeamConnect brings clarity to team communication — structured channels,
                    searchable history, and zero distractions.
                </p>
                <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-blue-600 text-white font-medium transition-colors"
                    >
                        Get Started Free
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                        href="#features"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border-soft text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
                    >
                        Learn More
                    </a>
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Problem                                                            */
/* ------------------------------------------------------------------ */
const problems = [
    {
        icon: Bell,
        text: "Constant notification overload across scattered tools",
    },
    {
        icon: Search,
        text: "Searching endlessly for that one message buried in noise",
    },
    {
        icon: Clock,
        text: "Context-switching between 5+ apps just to stay aligned",
    },
    {
        icon: FolderOpen,
        text: "Important decisions lost in unstructured chat threads",
    },
];

function ProblemSection() {
    return (
        <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary text-center mb-4">
                    Team communication is broken
                </h2>
                <p className="text-text-secondary text-center mb-12 max-w-lg mx-auto">
                    Most tools create more noise than clarity. Sound familiar?
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                    {problems.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-4 p-5 rounded-xl bg-panel-bg border border-border-soft"
                        >
                            <item.icon className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                            <span className="text-text-primary text-sm leading-relaxed">
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */
const features = [
    {
        icon: MessageSquare,
        title: "Structured Channels",
        description:
            "Organize conversations by project, team, or topic. Every discussion has a home — no more hunting through random threads.",
    },
    {
        icon: Shield,
        title: "Secure by Default",
        description:
            "End-to-end encryption, role-based access, and audit logs. Your team's conversations stay private and compliant.",
    },
    {
        icon: Zap,
        title: "Real-Time & Fast",
        description:
            "Instant messaging powered by WebSockets. Sub-second delivery with typing indicators and live presence.",
    },
];

function FeaturesSection() {
    return (
        <section id="features" className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-4">
                        Built for productive teams
                    </h2>
                    <p className="text-text-secondary max-w-md mx-auto">
                        Everything you need to keep your team aligned — nothing you don't.
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    {features.map((feat, i) => (
                        <div
                            key={i}
                            className="p-6 rounded-xl bg-panel-bg border border-border-soft shadow-sm hover:border-accent/30 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-5">
                                <feat.icon className="w-5 h-5 text-accent" />
                            </div>
                            <h3 className="text-text-primary font-medium text-base mb-2">
                                {feat.title}
                            </h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                {feat.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  How it Works                                                       */
/* ------------------------------------------------------------------ */
const steps = [
    {
        number: "01",
        title: "Create your workspace",
        description: "Set up your team in under a minute — no credit card required.",
    },
    {
        number: "02",
        title: "Invite your team",
        description: "Share an invite link or add members by email.",
    },
    {
        number: "03",
        title: "Organize channels",
        description: "Create channels for projects, departments, or anything else.",
    },
    {
        number: "04",
        title: "Start collaborating",
        description: "Send messages, share files, and stay aligned in real time.",
    },
];

function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-4">
                        Up and running in minutes
                    </h2>
                    <p className="text-text-secondary max-w-md mx-auto">
                        Four simple steps to transform how your team communicates.
                    </p>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl font-bold text-accent/30 mb-3">
                                {step.number}
                            </div>
                            <h3 className="text-text-primary font-medium text-sm mb-2">
                                {step.title}
                            </h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */
function FinalCTA() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-3xl mx-auto text-center rounded-2xl border border-border-soft bg-panel-bg p-12 sm:p-16">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-accent" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-4">
                    Ready to bring your team together?
                </h2>
                <p className="text-text-secondary mb-8 max-w-md mx-auto">
                    Join teams that have already moved past the noise. Start free — no
                    credit card, no setup headaches.
                </p>
                <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-blue-600 text-white font-medium transition-colors"
                >
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
    return (
        <footer className="border-t border-border-soft py-8 px-6">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                    <TeamConnectLogo className="w-5 h-5" />
                    <span>&copy; {new Date().getFullYear()} TeamConnect</span>
                </div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-text-primary transition-colors">
                        Privacy
                    </a>
                    <a href="#" className="hover:text-text-primary transition-colors">
                        Terms
                    </a>
                    <a href="#" className="hover:text-text-primary transition-colors">
                        Contact
                    </a>
                </div>
            </div>
        </footer>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-primary-bg font-sans">
            <Navbar />
            <main>
                <Hero />
                <ProblemSection />
                <FeaturesSection />
                <HowItWorks />
                <FinalCTA />
            </main>
            <Footer />
        </div>
    );
}
