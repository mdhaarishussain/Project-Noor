"use client";

import { motion } from "motion/react";
import { ArrowRight, ArrowLeft, Scale, Moon, Sun } from "lucide-react";
import Link from "next/link";
// Logo will be rendered from public assets (light/dark variants)
import { useEffect, useState } from "react";

const MotionLink = motion.create(Link);

// Logo now provided as an SVG under public/bondhu-logo.svg

export default function TermsPage() {
    const [activeSection, setActiveSection] = useState("");
    const [darkMode, setDarkMode] = useState(false);

    const sections = [
        { id: "about", label: "About Bondhu AI", number: "1" },
        { id: "eligibility", label: "Eligibility & Age", number: "2" },
        { id: "registration", label: "Account Registration", number: "3" },
        { id: "services", label: "Services", number: "4" },
        { id: "payments", label: "Payments & Subscriptions", number: "5" },
        { id: "ai-technology", label: "AI Technology & Third Parties", number: "6" },
        { id: "acceptable-use", label: "Acceptable Use", number: "7" },
        { id: "intellectual-property", label: "Intellectual Property", number: "8" },
        { id: "disclaimers", label: "Disclaimers & Liability", number: "9" },
        { id: "termination", label: "Account Termination", number: "10" },
        { id: "modifications", label: "Modifications to Terms", number: "11" },
        { id: "governing-law", label: "Governing Law", number: "12" },
        { id: "contact", label: "Contact", number: "13" },
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

    // Intersection observer for active section
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
            {/* Header with Back Button */}
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
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Legal Terms</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>


            <div className="container mx-auto px-6 py-16">
                <div className="flex gap-16 relative">
                    {/* Sidebar Navigation - scrollable TOC */}
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
                                                    variants={{ initial: { x: -24 }, hover: { x: 0 } }}
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

                            {/* Last Updated card - outside the TOC scroll area */}
                            <div className="mt-6">
                                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
                                    <h4 className="text-sm text-gray-500">Last Updated</h4>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">October 13, 2025</p>

                                    <div className="mt-4">
                                        <h5 className="text-sm text-gray-500">Effective Date</h5>
                                        <p className="text-base font-medium text-gray-900 dark:text-white mt-1">October 1, 2025</p>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">By accessing or using Bondhu AI, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>
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
                                    Terms of Service
                                </h1>
                                <div className="h-1.5 w-32 bg-gradient-to-r from-[#00d084] to-[#00a86b] rounded-full mb-8"></div>
                                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                                    Welcome to Bondhu AI. These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between you ("User," "You") and Bondhu AI ("Company," "We," "Us," "Our") governing your access to and use of the Bondhu AI website (bondhu.tech), mobile applications, and all related products, services, and features (collectively, the "Platform" or "Service").
                                </p>
                                <div className="bg-[#00d084]/10 dark:bg-[#00d084]/20 border-l-4 border-[#00d084] p-6 rounded-r-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        <span className="font-semibold text-gray-900 dark:text-white">Important Notice:</span> By accessing, browsing, or using the Platform in any manner, including but not limited to visiting or browsing the website, registering for an account, or using any services provided, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree with any part of these Terms, you must immediately discontinue use of the Platform.
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* All Sections - keep existing content below (placeholders included) */}

                        {/* Section 1 */}
                        <section id="about" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">1</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        About Bondhu AI
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    Bondhu (meaning <span className="font-semibold text-gray-900 dark:text-white">বন্ধু</span> or "friend" in Bengali) is an innovative artificial intelligence platform designed to serve as a comprehensive mental health and emotional well-being companion. The Platform leverages advanced AI technologies, including natural language processing, machine learning, and personality analysis algorithms, to provide:
                                </p>
                                <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-4">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span>Personalized emotional support and companionship through conversational AI</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span>Advanced personality insights based on psychological frameworks and behavioral analysis</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span>Interactive well-being experiences combining entertainment, education, and therapeutic engagement</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#00d084] font-bold mt-1">•</span>
                                        <span>Mood tracking, journaling, and reflective tools for mental wellness</span>
                                    </li>
                                </ul>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    Bondhu AI is operated by [Legal Entity Name], a company incorporated under the laws of India, with its registered office at Kolkata, West Bengal, India.
                                </p>
                            </div>
                        </section>

                        {/* (other sections remain unchanged below — file contains the rest) */}

                        {/* Section 2 */}
                        <section id="eligibility" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">2</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Eligibility & Age Requirements
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Minimum Age:</span> You must be at least 13 years of age to create an account or use the Platform. Users between the ages of 13 and 18 (or the age of majority in your jurisdiction) may only use the Service with the express consent and under the supervision of a parent or legal guardian who agrees to be bound by these Terms.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Legal Capacity:</span> By using the Platform, you represent and warrant that: (a) you have the legal capacity to enter into a binding contract under applicable law; (b) you are not prohibited by law from accessing or using the Service; (c) you will comply with these Terms and all applicable local, state, national, and international laws and regulations.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">Parental Consent:</span> If you are under 18, your parent or guardian must read and agree to these Terms on your behalf. We may require verification of parental consent and reserve the right to terminate accounts that fail to provide such verification.
                                </p>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section id="registration" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">3</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Account Registration & Security
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Account Creation:</span> To access certain features of the Platform, you must register for an account by providing accurate, current, and complete information as prompted by the registration process. You may register using third-party authentication services (e.g., Google OAuth) subject to their respective terms and conditions.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Account Security:</span> You are solely responsible for maintaining the confidentiality of your account credentials (username, password, authentication tokens) and for all activities that occur under your account. You agree to: (a) immediately notify us of any unauthorized use of your account; (b) ensure that you log out from your account at the end of each session; (c) not share your account credentials with any third party.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Account Information:</span> You agree to provide accurate, truthful, and up-to-date information during registration and to update such information promptly to maintain its accuracy. Providing false or misleading information may result in immediate account termination.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">Account Responsibility:</span> You acknowledge and agree that you are fully responsible for all activities conducted through your account, whether authorized by you or not. We shall not be liable for any loss or damage arising from your failure to comply with account security obligations.
                                </p>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section id="services" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">4</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Services Provided
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    Bondhu AI provides a range of AI-powered services and features, which may include but are not limited to:
                                </p>
                                <div className="grid gap-4 mb-4">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Companionship</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Interactive conversations with AI personalities designed to provide emotional support and companionship</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personality Analysis</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Advanced personality assessments and insights based on psychological frameworks</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Well-being Tools</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Mood tracking, journaling, meditation guides, and mental wellness resources</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Entertainment & Learning</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Interactive experiences combining entertainment with educational content</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">Service Modifications:</span> We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice, and without liability to you. We may also impose limits on certain features or restrict access to parts or all of the Service without notice or liability.
                                </p>
                            </div>
                        </section>

                        {/* Section 5 */}
                        <section id="payments" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">5</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Payments, Subscriptions & Billing
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Paid Services:</span> Certain features, content, or services may require payment of fees ("Paid Services"). All fees are exclusive of applicable taxes unless otherwise stated. You agree to pay all fees associated with your use of Paid Services in accordance with the pricing and payment terms presented to you at the time of purchase.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Subscriptions:</span> Paid Services may be offered on a subscription basis with recurring payments. By subscribing, you authorize us to charge your designated payment method on a recurring basis according to your selected billing cycle (monthly, annually, etc.). Subscriptions automatically renew unless canceled prior to the renewal date.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Payment Methods:</span> We accept payment through various methods including credit cards, debit cards, and third-party payment processors. You represent and warrant that you have the legal right to use any payment method you provide.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Refund Policy:</span> All payments are generally non-refundable unless otherwise required by applicable law or explicitly stated in our refund policy. Refund requests must be submitted within [X] days of purchase and will be evaluated on a case-by-case basis.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">Price Changes:</span> We reserve the right to modify subscription pricing with at least 30 days' advance notice. Continued use of the Service after price changes constitutes acceptance of the new pricing.
                                </p>
                            </div>
                        </section>

                        {/* Section 6 */}
                        <section id="ai-technology" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">6</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        AI Technology & Third-Party Services
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">AI-Generated Content:</span> Bondhu AI utilizes advanced artificial intelligence, machine learning models, natural language processing, and related technologies, which may include proprietary algorithms and third-party AI services. AI-generated content and responses are probabilistic in nature and may contain errors, inaccuracies, or unintended outputs.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Third-Party Services:</span> The Platform may integrate with or utilize third-party services, APIs, and technologies including but not limited to cloud infrastructure providers, authentication services, payment processors, and AI model providers. Your use of such services is subject to their respective terms and privacy policies.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">No Guarantee of Accuracy:</span> While we strive to provide accurate and helpful information, we make no representations or warranties regarding the accuracy, reliability, completeness, or timeliness of AI-generated content. You acknowledge that AI technology is not infallible and may produce unexpected or incorrect results.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">User Discretion:</span> You are solely responsible for evaluating the accuracy, appropriateness, and applicability of any AI-generated content. We are not responsible for any decisions, actions, or consequences resulting from your reliance on AI-generated information.
                                </p>
                            </div>
                        </section>

                        {/* Section 7 */}
                        <section id="acceptable-use" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">7</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Acceptable Use Policy
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    You agree to use the Platform only for lawful purposes and in accordance with these Terms. You expressly agree NOT to:
                                </p>
                                <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 dark:border-red-600 p-6 rounded-r-lg mb-4">
                                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-3">Prohibited Activities</h4>
                                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Upload, transmit, or distribute any malicious code, viruses, malware, or harmful content that could damage or disrupt the Platform or other users' devices</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Harass, threaten, intimidate, impersonate, stalk, or abuse other users or third parties</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Violate any applicable local, state, national, or international laws, regulations, or legal obligations</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Use automated tools, bots, scrapers, spiders, or other automated means to access the Platform without our express written authorization</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Attempt to gain unauthorized access to any portion of the Platform, other users' accounts, or systems connected to the Platform</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Reverse engineer, decompile, disassemble, or attempt to derive source code from the Platform</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Upload or share content that is illegal, defamatory, obscene, pornographic, or violates intellectual property rights</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Engage in any activity that could harm minors or promote child exploitation or abuse</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-red-500 dark:text-red-400 font-bold mt-1">×</span>
                                            <span>Use the Platform for commercial purposes without our express written permission</span>
                                        </li>
                                    </ul>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">Enforcement:</span> Bondhu reserves the right to investigate violations of this Acceptable Use Policy and to suspend, terminate, or restrict access to accounts that violate these Terms, with or without prior notice and without liability to you. We may also report illegal activities to law enforcement authorities.
                                </p>
                            </div>
                        </section>

                        {/* Section 8 */}
                        <section id="intellectual-property" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">8</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Intellectual Property Rights
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Our Proprietary Rights:</span> All content, materials, software, code, algorithms, artificial intelligence models, text, graphics, logos, icons, images, audio clips, video clips, data compilations, user interfaces, visual interfaces, and other materials available on or through the Platform (collectively, "Platform Content") are the exclusive intellectual property of Bondhu AI and are protected by Indian and international copyright, trademark, patent, trade secret, and other intellectual property laws.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Limited License:</span> Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Platform and Platform Content solely for your personal, non-commercial use. This license does not include any right to: (a) resell or make commercial use of the Platform or Platform Content; (b) download, copy, or modify any portion of the Platform except as expressly permitted; (c) use any data mining, robots, or similar data gathering tools.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">User-Generated Content:</span> You retain ownership of any content, data, text, information, or materials you submit, upload, or otherwise provide to the Platform ("User Content"). By submitting User Content, you grant Bondhu AI a worldwide, perpetual, irrevocable, royalty-free, sublicensable license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such User Content for the purposes of providing, maintaining, improving, and promoting the Service.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Trademarks:</span> "Bondhu," "Bondhu AI," and related logos, product names, and service names are trademarks or registered trademarks of Bondhu AI. You may not use these marks without our prior written permission.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">Copyright Infringement:</span> We respect intellectual property rights. If you believe that your copyright has been infringed, please contact us at bondhuaitech@gmail.com with detailed information about the alleged infringement.
                                </p>
                            </div>
                        </section>

                        {/* Section 9 */}
                        <section id="disclaimers" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">9</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Disclaimers & Limitations of Liability
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 dark:border-amber-600 p-6 rounded-r-lg mb-6">
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-3 text-lg">
                                        IMPORTANT MEDICAL DISCLAIMER
                                    </h4>
                                    <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <li className="flex items-start gap-3">
                                            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">⚠</span>
                                            <span><span className="font-semibold text-gray-900 dark:text-white">Not Medical Advice:</span> Bondhu AI is an artificial intelligence companion tool designed for informational and emotional support purposes only. It is NOT a licensed therapist, psychologist, psychiatrist, counselor, social worker, or healthcare provider.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">⚠</span>
                                            <span><span className="font-semibold text-gray-900 dark:text-white">No Professional Relationship:</span> Use of the Platform does not create a doctor-patient, therapist-client, or any other professional healthcare relationship.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">⚠</span>
                                            <span><span className="font-semibold text-gray-900 dark:text-white">Not Emergency Service:</span> The Platform is not intended for use in emergency situations. If you are experiencing a mental health crisis, suicidal thoughts, or medical emergency, immediately contact emergency services (112 in India), a suicide prevention hotline, or visit the nearest emergency room.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">⚠</span>
                                            <span><span className="font-semibold text-gray-900 dark:text-white">Seek Professional Help:</span> You should not disregard, avoid, delay, or discontinue professional medical or mental health advice, diagnosis, or treatment based on information or interactions with Bondhu AI.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-amber-600 dark:text-amber-400 font-bold mt-1">⚠</span>
                                            <span><span className="font-semibold text-gray-900 dark:text-white">No Guarantees:</span> We do not guarantee the accuracy, completeness, reliability, effectiveness, or suitability of any AI-generated content, recommendations, or suggestions.</span>
                                        </li>
                                    </ul>
                                </div>

                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                                    Service Disclaimers
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 uppercase font-semibold text-sm tracking-wide">
                                    THE PLATFORM AND ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    To the fullest extent permitted by applicable law, Bondhu AI disclaims all warranties, express or implied, including but not limited to: (a) implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement; (b) warranties regarding the availability, accuracy, reliability, or timeliness of the Service; (c) warranties that the Service will be uninterrupted, secure, or error-free; (d) warranties regarding the results that may be obtained from use of the Service.
                                </p>

                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg mt-6">
                                    Limitation of Liability
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    To the maximum extent permitted by Indian law and applicable international laws:
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    IN NO EVENT SHALL BONDHU AI, ITS FOUNDERS, DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, CONTRACTORS, LICENSORS, SERVICE PROVIDERS, OR PARTNERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE PLATFORM.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    Our total aggregate liability for all claims arising out of or related to these Terms or the Service shall not exceed the greater of: (a) the amount you paid to Bondhu AI in the twelve (12) months immediately preceding the claim; or (b) ₹5,000 (Indian Rupees Five Thousand).
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities. In such jurisdictions, our liability shall be limited to the greatest extent permitted by law.
                                </p>
                            </div>
                        </section>

                        {/* Continue with remaining sections following the same dark mode pattern... */}
                        {/* Sections 10-13 would follow here with identical dark mode classes */}

                        {/* Section 10 - Termination */}
                        <section id="termination" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">10</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Account Termination & Suspension
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Your Right to Terminate:</span> You may terminate your account at any time by: (a) using the account deletion feature within the Platform settings; or (b) contacting our support team at bondhuaitech@gmail.com with a termination request. Upon termination, your right to access and use the Service will immediately cease.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Effect of Termination:</span> Upon termination: (a) all licenses and rights granted to you under these Terms will immediately cease; (b) you must immediately cease all use of the Platform; (c) we may delete your account data in accordance with our Privacy Policy and data retention practices.
                                </p>
                            </div>
                        </section>

                        {/* Section 11 - Modifications */}
                        <section id="modifications" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">11</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Modifications to Terms
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Right to Modify:</span> Bondhu AI reserves the right to modify, amend, update, or replace these Terms at any time, at our sole discretion. We may make changes to reflect changes in law, regulatory requirements, business practices, or improvements to the Service.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">Acceptance of Changes:</span> Your continued access to or use of the Platform after the updated Terms become effective constitutes your acceptance of the revised Terms. If you do not agree to the modified Terms, you must immediately discontinue use of the Platform and may terminate your account.
                                </p>
                            </div>
                        </section>

                        {/* Section 12 - Governing Law */}
                        <section id="governing-law" className="mb-16 scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">12</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Governing Law & Dispute Resolution
                                    </h2>
                                </div>
                            </div>
                            <div className="pl-16 prose prose-lg max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                    <span className="font-semibold text-gray-900 dark:text-white">Governing Law:</span> These Terms and your use of the Platform shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. The Indian Contract Act, 1872, the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and other applicable Indian laws shall apply.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-gray-900 dark:text-white">Jurisdiction:</span> Any disputes, claims, or controversies arising out of or relating to these Terms, the Platform, or your relationship with Bondhu AI shall be subject to the exclusive jurisdiction of the competent courts located in Kolkata, West Bengal, India.
                                </p>
                            </div>
                        </section>

                        {/* Section 13 - Contact */}
                        <section id="contact" className="scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00d084] to-[#00a86b] rounded-xl flex items-center justify-center shadow-lg shadow-[#00d084]/20">
                                    <span className="text-white font-bold text-lg">13</span>
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
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 italic">
                                    We typically respond to inquiries within 48-72 business hours. For urgent matters, please indicate "URGENT" in your subject line.
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
                                Your AI companion for mental health and emotional well-being.
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
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Resources</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>
                                    <Link href="/help" className="hover:text-[#00d084] transition-colors">
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="hover:text-[#00d084] transition-colors">
                                        Contact Us
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            © {new Date().getFullYear()} Bondhu AI. All rights reserved. Made with ❤️ in Kolkata, India
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
