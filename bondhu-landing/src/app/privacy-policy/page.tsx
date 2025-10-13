"use client";

import { motion } from "motion/react";
import { ArrowRight, ArrowLeft, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const MotionLink = motion.create(Link);

export default function PrivacyPage() {
    const [activeSection, setActiveSection] = useState("");
    const [darkMode, setDarkMode] = useState(false);

    const sections = [
        { id: "information-collect", label: "Information We Collect", number: "1" },
        { id: "legal-basis", label: "Legal Basis for Processing", number: "2" },
        { id: "how-we-use", label: "How We Use Your Data", number: "3" },
        { id: "data-sharing", label: "Data Sharing & Third Parties", number: "4" },
        { id: "data-security", label: "Data Security", number: "5" },
        { id: "data-retention", label: "Data Retention", number: "6" },
        { id: "your-rights", label: "Your Privacy Rights", number: "7" },
        { id: "children-privacy", label: "Children's Privacy", number: "8" },
        { id: "cookies", label: "Cookies & Tracking", number: "9" },
        { id: "international-transfers", label: "International Transfers", number: "10" },
        { id: "data-breach", label: "Data Breach Notification", number: "11" },
        { id: "grievance-officer", label: "Grievance Officer", number: "12" },
        { id: "policy-updates", label: "Policy Updates", number: "13" },
        { id: "language", label: "Language Availability", number: "14" },
        { id: "contact", label: "Contact Information", number: "15" },
        { id: "governing-law", label: "Governing Law", number: "16" },
    ];

    // Dark mode effect
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            setDarkMode(true);
            document.documentElement.classList.add("dark");
        }
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    // Intersection observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: "-20% 0px -70% 0px" }
        );

        sections.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 120;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#00d084] transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Home</span>
                        </Link>

                        <div className="flex items-center gap-6">
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? (
                                    <Sun className="w-5 h-5 text-yellow-500" />
                                ) : (
                                    <Moon className="w-5 h-5 text-gray-700" />
                                )}
                            </button>

                            <div className="flex items-center gap-3">
                                <img
                                    src={darkMode ? "/Dark mode Logo.svg" : "/Light mode logo.svg"}
                                    alt="Bondhu AI logo"
                                    className="w-20 h-20 object-contain"
                                />
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Bondhu AI</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Privacy Policy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-16">
                <div className="flex gap-16 relative">
                    {/* Sidebar - Scrollable */}
                    <aside className="w-80 flex-shrink-0">
                        <div className="sticky top-32">
                            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl transition-colors duration-300">
                                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-6 tracking-widest uppercase">
                                        Table of Contents
                                    </h2>

                                    <div className="flex flex-col gap-3">
                                        {sections.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                className="group/nav flex items-center gap-2 cursor-pointer"
                                                initial="initial"
                                                whileHover="hover"
                                                onClick={() => scrollToSection(item.id)}
                                            >
                                                <motion.div
                                                    variants={{
                                                        initial: { x: "-100%", opacity: 0 },
                                                        hover: { x: 0, opacity: 1 },
                                                    }}
                                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                                    className="z-0"
                                                >
                                                    <ArrowRight
                                                        strokeWidth={3}
                                                        className={`w-6 h-6 ${activeSection === item.id
                                                                ? "text-[#00d084]"
                                                                : "text-gray-400 dark:text-gray-600"
                                                            }`}
                                                    />
                                                </motion.div>

                                                <motion.button
                                                    variants={{
                                                        initial: { x: -24 },
                                                        hover: { x: 0 },
                                                    }}
                                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                                    className={`font-semibold text-lg text-left transition-colors ${activeSection === item.id
                                                            ? "text-[#00d084]"
                                                            : "text-gray-800 dark:text-gray-300 hover:text-[#00d084]"
                                                        }`}
                                                >
                                                    {item.number}. {item.label}
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Card */}
                            <div className="mt-6">
                                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                Last Updated
                                            </p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                October 13, 2025
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                                Effective Date
                                            </p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                October 1, 2025
                                            </p>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                                Complies with DPDP Act 2023, IT Act 2000, and Mental Healthcare Act 2017.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0 max-w-4xl">
                        {/* Hero Section */}
                        <div className="mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                                    Privacy Policy
                                </h1>
                                <div className="h-1.5 w-32 bg-gradient-to-r from-[#00d084] to-[#00a86b] rounded-full mb-8"></div>
                                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                                    This Privacy Policy explains how Bondhu AI ("we," "our," or "Bondhu") collects, uses, stores, shares, and protects your personal information when you use our Platform at bondhu.tech. This policy complies with the Digital Personal Data Protection Act, 2023 (DPDP Act), the Information Technology Act, 2000, and the Mental Healthcare Act, 2017.
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 dark:border-blue-600 p-6 rounded-r-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        <span className="font-semibold text-gray-900 dark:text-white">Your Privacy Matters:</span> We are committed to protecting your personal data and providing transparency about our data practices. This policy outlines your rights and how we safeguard your information in accordance with Indian data protection laws.
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Section 1 - Information We Collect */}
                        <section id="information-collect" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">1</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Information We Collect
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    We collect the following categories of personal data necessary to provide and improve Bondhu's services:
                                </p>

                                <div className="space-y-4 mb-6">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <span className="text-[#00d084]">📧</span> Account Data
                                        </h4>
                                        <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm ml-6">
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Email address (required for account creation and communication)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Name (optional for personalization)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Authentication details (email or Google OAuth credentials)</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <span className="text-[#00d084]">💬</span> Usage Data
                                        </h4>
                                        <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm ml-6">
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Conversation logs and chat history with AI companions</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>User preferences, settings, and customizations</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Activity patterns, feature usage, and engagement metrics</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <span className="text-[#00d084]">🧠</span> Personality & Well-being Data
                                        </h4>
                                        <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm ml-6">
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Responses to personality assessments, quizzes, and interactive games</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Behavioral insights and patterns derived from AI interactions</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Emotional well-being indicators and mood tracking data</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <span className="text-[#00d084]">🔧</span> Technical Data
                                        </h4>
                                        <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm ml-6">
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Device type, model, and operating system information</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Browser type, version, and language preferences</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>IP address (for security, analytics, and fraud prevention)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-[#00d084] mt-1">•</span>
                                                <span>Cookies and similar tracking technologies</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Governing Law moved to the end of the page per request */}
                        {/* Section 2 - Legal Basis */}
                        <section id="legal-basis" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">2</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Legal Basis for Data Processing
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    We process your personal data based on the following legal grounds under the DPDP Act, 2023:
                                </p>
                                <div className="grid gap-4">
                                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                        <span className="text-2xl">✓</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Consent</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">You provide explicit, informed, and freely given consent when creating an account and using our services</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                        <span className="text-2xl">✓</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Contractual Necessity</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">To perform our services as outlined in the Terms of Service agreement</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                        <span className="text-2xl">✓</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Legitimate Interests</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">To improve services, ensure platform security, and prevent fraud or abuse</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                        <span className="text-2xl">✓</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Legal Obligations</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">To comply with applicable Indian laws, regulations, and legal processes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 3 - How We Use Data */}
                        <section id="how-we-use" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">3</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        How We Use Your Data
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    Your personal information is used for the following purposes:
                                </p>
                                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold text-gray-900 dark:text-white">Service Delivery:</span> Provide personalized AI conversations, personality insights, well-being tools, and analytics</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold text-gray-900 dark:text-white">AI Improvement:</span> Train and enhance AI models, improve adaptive personality response systems, and refine recommendation algorithms</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold text-gray-900 dark:text-white">Account Management:</span> Maintain account functionality, security, authentication, and user preferences</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold text-gray-900 dark:text-white">Communication:</span> Send service updates, feature announcements, security alerts, and support responses</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold text-gray-900 dark:text-white">Analytics & Research:</span> Understand usage patterns, conduct research, and enhance user experience</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold text-gray-900 dark:text-white">Security & Fraud Prevention:</span> Detect and prevent fraud, abuse, unauthorized access, and security threats</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold text-gray-900 dark:text-white">Legal Compliance:</span> Meet legal and regulatory obligations under Indian law</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 4 - Data Sharing */}
                        <section id="data-sharing" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">4</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Data Sharing & Third-Party Services
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <div className="bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 dark:border-green-600 p-6 rounded-r-lg mb-6">
                                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                                        We Do Not Sell Your Data
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Bondhu does not sell, rent, or trade your personal information to third parties for marketing purposes. Your data is your own.
                                    </p>
                                </div>

                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Limited Sharing with Service Providers</h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    We may share your data with trusted third-party service providers strictly for operational purposes, including:
                                </p>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold">AI Service Providers</span> (e.g., Gemini, Anthropic) for generating responses and personality analysis</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold">Cloud Hosting Providers</span> (e.g., Supabase) for secure data storage and infrastructure</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold">Payment Processors</span> for handling transactions securely</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span><span className="font-semibold">Analytics Tools</span> for understanding user behavior (anonymized where possible)</span>
                                    </li>
                                </ul>
                                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    All third-party partners are bound by strict confidentiality and data protection agreements and process data only as instructed by Bondhu AI.
                                </p>

                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg mt-6">Legal Disclosures</h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    We may disclose your information if required by law, court order, government authority, or to protect our legal rights, prevent fraud, or ensure user safety.
                                </p>
                            </div>
                        </section>

                        {/* Section 5 - Data Security */}
                        <section id="data-security" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">5</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Data Security Measures
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                    We implement industry-standard security practices to protect your personal data:
                                </p>
                                <div className="grid gap-4 mb-6">
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-3xl">🔒</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Encryption</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">All data is encrypted in transit (using HTTPS/TLS) and at rest using AES-256 encryption</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-3xl">🛡️</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Row-Level Security (RLS)</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Implemented via Supabase backend to isolate user data and prevent unauthorized access</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-3xl">🔑</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Access Controls</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Restricted access to personal data on a strict need-to-know basis with role-based permissions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
                                        <span className="text-3xl">🔍</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Regular Security Audits</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Periodic security assessments, vulnerability testing, and penetration testing</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 dark:border-amber-600 p-4 rounded-r-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold text-gray-900 dark:text-white">Important Note:</span> While we employ robust security measures, no online system is 100% secure. Users share data at their own discretion.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 6 - Data Retention */}
                        <section id="data-retention" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">6</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Data Retention Policy
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#00d084] rounded-r-lg">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Active Accounts</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Personal data is retained as long as your account remains active and you continue using our services</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#00d084] rounded-r-lg">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Inactive Accounts</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Data may be retained for up to 12 months after account inactivity before deletion, allowing account recovery</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#00d084] rounded-r-lg">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Deleted Accounts</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Upon account deletion, personal data is permanently erased within 30 days, except where retention is required by law</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#00d084] rounded-r-lg">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Legal Compliance</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Some data may be retained longer to comply with legal obligations, resolve disputes, or enforce agreements</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 7 - Your Rights */}
                        <section id="your-rights" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">7</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Your Privacy Rights
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                    Under the DPDP Act, 2023 and applicable Indian laws, you have the following rights:
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-[#00d084]/10 to-transparent dark:from-[#00d084]/20 border border-[#00d084]/30 rounded-xl">
                                        <span className="text-2xl">👁️</span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Right to Access</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Request access to view the personal data we hold about you</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-[#00d084]/10 to-transparent dark:from-[#00d084]/20 border border-[#00d084]/30 rounded-xl">
                                        <span className="text-2xl">✏️</span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Right to Correction</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Request correction or updating of inaccurate or incomplete personal data</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-[#00d084]/10 to-transparent dark:from-[#00d084]/20 border border-[#00d084]/30 rounded-xl">
                                        <span className="text-2xl">🗑️</span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Right to Erasure ("Right to be Forgotten")</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Request deletion of your personal data, subject to legal retention requirements</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-[#00d084]/10 to-transparent dark:from-[#00d084]/20 border border-[#00d084]/30 rounded-xl">
                                        <span className="text-2xl">📤</span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Right to Data Portability</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Request export of your personal data in a machine-readable format (JSON, CSV)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-[#00d084]/10 to-transparent dark:from-[#00d084]/20 border border-[#00d084]/30 rounded-xl">
                                        <span className="text-2xl">🚫</span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Right to Withdraw Consent</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Withdraw your consent for data processing at any time (note: this may limit some features)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-[#00d084]/10 to-transparent dark:from-[#00d084]/20 border border-[#00d084]/30 rounded-xl">
                                        <span className="text-2xl">📝</span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Right to Grievance Redressal</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">File a complaint regarding data processing practices with our Grievance Officer</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold text-gray-900 dark:text-white">How to Exercise Your Rights:</span> To exercise any of these rights, please contact our Privacy team via the Contact section below. We will respond to your request within 30 days of receipt.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 8 - Children's Privacy & Parental Consent */}
                        <section id="children-privacy" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">8</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Children's Privacy & Parental Consent
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <div className="bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-500 dark:border-purple-600 p-6 rounded-r-lg mb-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                                        <span className="font-semibold text-gray-900 dark:text-white">Age Restriction:</span> Bondhu does not knowingly collect personal data from children under 13 years of age without verifiable parental consent.
                                    </p>
                                </div>
                                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span>Users aged 13–17 years may only use Bondhu with verifiable parental or legal guardian consent</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span>Parents or guardians can review, modify, or request deletion of their child's data by contacting us</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span>If we discover that we have inadvertently collected data from a child under 13 without parental consent, we will promptly delete such data</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Remaining sections 9-16 follow same pattern... */}
                        {/* I'll add the remaining sections from the privacy text */}

                        {/* Section 9 - Cookies & Tracking */}
                        <section id="cookies" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">9</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Cookies & Tracking Technologies</h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    Bondhu uses cookies and similar technologies to:
                                </p>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li>Maintain user sessions and authentication</li>
                                    <li>Analyze usage patterns and improve services</li>
                                    <li>Provide personalized experiences</li>
                                </ul>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                                    You can manage cookie preferences through your browser settings. Note that disabling cookies may affect Platform functionality.
                                </p>
                            </div>
                        </section>

                        {/* Section 10 - International Transfers */}
                        <section id="international-transfers" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">10</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">International Data Transfers</h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    Your data may be transferred to and processed in locations outside India for cloud hosting and AI processing purposes. We ensure that all such transfers comply with applicable data protection laws and include appropriate safeguards.
                                </p>
                            </div>
                        </section>

                        {/* Section 11 - Data Breach Notification */}
                        <section id="data-breach" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">11</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Data Breach Notification</h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    In the event of a data breach that may compromise your personal information, we will:
                                </p>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li>Notify affected users via email within 72 hours of discovering the breach</li>
                                    <li>Report the breach to the Data Protection Board of India as required by law</li>
                                    <li>Take immediate steps to mitigate harm and prevent future breaches</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 12 - Grievance Redressal Officer */}
                        <section id="grievance-officer" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">12</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Grievance Redressal Officer</h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    For privacy-related concerns, complaints, or requests, you may contact our Grievance Redressal Officer:
                                </p>
                                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                    <li>📧 Email: <a href="mailto:bondhuaitech@gmail.com" className="text-[#00d084] hover:underline">bondhuaitech@gmail.com</a></li>
                                    <li>🌐 Website: <a href="https://bondhu.tech" target="_blank" rel="noopener noreferrer" className="text-[#00d084] hover:underline">bondhu.tech</a></li>
                                    <li>📍 Location: Kolkata, India</li>
                                </ul>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">We will acknowledge your complaint within 24 hours and resolve it within 30 days.</p>
                            </div>
                        </section>

                        {/* Section 13 - Policy Updates */}
                        <section id="policy-updates" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">13</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Updates to This Privacy Policy</h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Updated versions will be posted on this page with a revised "Last Updated" date. Material changes will be communicated via email or prominent notice on the Platform. Continued use after changes constitutes acceptance of the updated Privacy Policy.
                                </p>
                            </div>
                        </section>

                        {/* Section 14 - Language Availability */}
                        <section id="language" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">14</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Language Availability</h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    This Privacy Policy is available in English. In compliance with the DPDP Act, we are working to make this policy available in additional Indian languages listed in the 8th Schedule of the Indian Constitution.
                                </p>
                            </div>
                        </section>

                        {/* Section 15 - Contact */}
                        <section id="contact" className="scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">15</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Contact Information
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    If you have any questions, concerns, feedback, or requests regarding these Terms of Service, please contact us using the contact form on our website.
                                </p>
                            </div>
                        </section>

                        {/* Section 16 - Governing Law */}
                        <section id="governing-law" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">16</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Governing Law</h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                                    <strong>Governing Law:</strong> These Terms and your use of the Platform shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. The Indian Contract Act, 1872, the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and other applicable Indian laws shall apply.
                                </p>

                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <strong>Jurisdiction:</strong> Any disputes, claims, or controversies arising out of or relating to these Terms, the Platform, or your relationship with Bondhu AI shall be subject to the exclusive jurisdiction of the competent courts located in Kolkata, West Bengal, India.
                                </p>
                            </div>
                        </section>

                    </main>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-24 transition-colors duration-300">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Bondhu AI</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                Committed to protecting your privacy and personal data.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>
                                    <Link href="/terms-of-service" className="hover:text-[#00d084] transition-colors">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy-policy" className="hover:text-[#00d084] transition-colors">
                                        Privacy Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Compliance</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>DPDP Act 2023</li>
                                <li>IT Act 2000</li>
                                <li>Mental Healthcare Act 2017</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            © {new Date().getFullYear()} Bondhu AI. All rights reserved. Your privacy is our priority.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
