"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "What is Bondhu?",
            answer: "Bondhu is an AI-powered mental health companion designed specifically for Gen Z in India. The name \"Bondhu\" means \"friend\" in Bengali, reflecting our mission to be your trusted digital companion for mental wellness. Unlike generic mental health apps, Bondhu understands your unique personality through your music preferences, gaming habits, and entertainment choices to provide truly personalized support.",
        },
        {
            question: "Is Bondhu a replacement for therapy or medication?",
            answer: "No. Bondhu is a mental wellness companion, not a substitute for professional mental health treatment. While we can help with stress management, mood tracking, and daily emotional support, we strongly encourage seeking professional help for severe depression, anxiety disorders, suicidal thoughts, or any condition requiring medication. Think of Bondhu as your first step towards mental wellness or a supplement to professional therapy.",
        },
        {
            question: "When is Bondhu launching?",
            answer: "Bondhu is launching on October 10, 2025 — World Mental Health Day.",
        },
        {
            question: "How does Bondhu understand my personality?",
            answer: "Bondhu uses advanced multi-agent AI architecture powered by four specialized intelligence agents: Music Intelligence Agent (analyzes your Spotify listening habits), Video Intelligence Agent (understands your entertainment preferences), Gaming Intelligence Agent (examines your Steam gaming patterns), and Personality Analysis Agent (synthesizes all data using the Big Five personality model). This comprehensive approach helps Bondhu understand not just what you say, but who you are.",
        },
        {
            question: "What makes Bondhu different from other mental health apps?",
            answer: "Most mental health apps use generic, one-size-fits-all approaches. Bondhu is different because: Culturally aware (understands Indian family dynamics, social pressures, and cultural context), Personality-driven (adapts conversations based on your unique personality traits), Multi-modal analysis (uses your entertainment preferences to build a complete picture), Proactive support (reaches out when patterns suggest you might need help), and Always learning (continuously updates its understanding as you grow and change).",
        },
        {
            question: "Do I need to connect my Spotify, Steam, or other accounts?",
            answer: "Connections are optional but highly recommended. The more data Bondhu has about your preferences, the better it can understand and support you. All integrations are: Secure (OAuth-based authentication, industry-standard encryption), Private (your data never leaves our secure servers), and Controllable (disconnect anytime without losing your chat history).",
        },
        {
            question: "Is my data safe with Bondhu?",
            answer: "Absolutely. Privacy is our top priority: End-to-end encryption for all conversations, GDPR-compliant data handling practices, Zero third-party data selling - your information is never shared or sold, Secure storage on enterprise-grade Supabase infrastructure, and You own your data - export or delete anytime.",
        },
        {
            question: "Who can see my conversations with Bondhu?",
            answer: "Only you. Bondhu conversations are completely private and encrypted. We don't share your data with: Parents or family members, Schools or employers, Third-party advertisers, or Insurance companies.",
        },
        {
            question: "What data does Bondhu collect?",
            answer: "Bondhu collects: Conversations (your chat messages with the AI), Personality data (Big Five personality test results), Entertainment preferences (if connected - Spotify music, Steam games, video preferences), and Usage patterns (app interaction data to improve the experience). We never collect: Location data, Contact lists, Photos or files (unless you choose to share), or Financial information.",
        },
        {
            question: "Can I delete my data?",
            answer: "Yes, completely. From your account settings: Delete specific conversations (remove individual chats), Disconnect integrations (revoke Spotify/Steam access), and Delete account (permanently erase all data within 30 days).",
        },
        {
            question: "What can I talk to Bondhu about?",
            answer: "Bondhu is here for a wide range of mental health topics: Academic stress and exam anxiety, Family and relationship issues, Career confusion and pressure, Social anxiety and loneliness, Self-esteem and body image, Daily mood tracking, Coping strategies for stress, and Goal setting and motivation. Bondhu cannot help with: Medical emergencies, suicidal crises (please call 9152987821 - AASRA helpline), substance abuse requiring detox, or severe psychiatric conditions requiring medication.",
        },
        {
            question: "Does Bondhu work in Hindi or other Indian languages?",
            answer: "Yes! Bondhu Supports all Major Indian (22 scheduled languages) and Major International Languages.",
        },
        {
            question: "Can Bondhu recognize when I'm in crisis?",
            answer: "Yes. Bondhu's AI is trained to identify concerning patterns like: Expressions of self-harm or suicidal ideation, Severe anxiety or panic attacks, Symptoms of clinical depression, and Substance abuse indicators. When detected, Bondhu will: Provide immediate crisis resources (helpline numbers), Encourage seeking professional help, and Offer grounding exercises while you wait for support.",
        },
        {
            question: "How does Bondhu remember our conversations?",
            answer: "Bondhu uses advanced context management to remember: Previous conversations and topics discussed, Your emotional patterns and triggers, Goals you've set and progress tracking, and Preferences about how you like to be supported. This memory resets if you delete conversations or choose a \"fresh start\" from settings.",
        },
        {
            question: "Is Bondhu free?",
            answer: "Yes! Bondhu is 100% free for all users at launch. We're committed to making mental health support accessible, especially recognizing that many students and young adults can't afford expensive therapy.",
        },
        {
            question: "Will Bondhu always be free?",
            answer: "Our free tier will always remain available with core features. In the future, we may introduce a premium tier (₹299/month) with: Priority response times, Advanced personality insights dashboard, Integration with professional therapists, Extended conversation history, and Family sharing features. But the core Bondhu experience - personalized AI conversations - will always be free.",
        },
        {
            question: "Do I need to give credit card information?",
            answer: "No. No credit card, no payment method required. Just sign up with your email and start chatting.",
        },
        {
            question: "What devices does Bondhu work on?",
            answer: "Bondhu is available as: Web app (Access from any browser at bondhu.tech - Best experience from a Desktop) and Mobile app (Coming soon for iOS and Android - Q1 2026). The web app is fully responsive and works perfectly on mobile browsers.",
        },
        {
            question: "Do I need internet to use Bondhu?",
            answer: "Yes, Bondhu requires an internet connection to process conversations through our AI. Offline mode is on our roadmap for basic features like mood tracking and journal entries.",
        },
        {
            question: "How do I sign up?",
            answer: "1. Visit bondhu.tech, 2. Create account with email, 3. Complete brief personality assessment (5 minutes), 4. Start chatting!",
        },
        {
            question: "Do I need to take a personality test?",
            answer: "A brief initial assessment (10-15 questions, 5 minutes) helps Bondhu understand you better. It's highly recommended for personality discovery as it is based on OCEAN Big Five Inventory–2 (BFI-2) XS test.",
        },
        {
            question: "What if I'm not comfortable sharing everything right away?",
            answer: "That's completely normal! Start with whatever you're comfortable sharing. Bondhu will: Never pressure you to share more than you want, Build understanding gradually through conversations, Respect your boundaries, and Let you control what data to connect (Spotify, etc.).",
        },
        {
            question: "Is Bondhu safe for minors?",
            answer: "Bondhu is designed for ages 16+ (typical Gen Z college/high school students). For users under 18, we recommend: Parental awareness (not supervision - privacy is important), Understanding that Bondhu is supplementary support, and Professional help for serious issues. We do not allow users under 13 per COPPA regulations.",
        },
        {
            question: "How can schools or colleges use Bondhu?",
            answer: "We're developing institutional partnerships for: Campus mental wellness programs, Student support services integration, Anonymous usage analytics for administrators, and Workshop and awareness campaigns. Contact team@bondhu.tech for institutional partnerships.",
        },
        {
            question: "What if I'm in immediate danger or crisis?",
            answer: "Please seek immediate help: India Crisis Helplines: AASRA: 9152987821 (24/7), iCall: 9152987821, Vandrevala Foundation: 1860-2662-345, Emergency: 112 (Police). International: US: 988 (Suicide & Crisis Lifeline), UK: 116 123 (Samaritans). Bondhu will also provide these resources if it detects crisis language.",
        },
        {
            question: "Why is Bondhu not responding?",
            answer: "Try these steps: 1. Check your internet connection, 2. Refresh the page/app, 3. Clear browser cache and cookies, 4. Try a different browser, 5. Contact bondhuaitech@gmail.com if issue persists.",
        },
        {
            question: "How do I report a problem or bug?",
            answer: "Email bondhuaitech@gmail.com with: Description of the issue, Screenshots if possible, Device/browser information, and Your account email. We typically respond within 24 hours.",
        },
        {
            question: "Can I provide feedback or suggest features?",
            answer: "Absolutely! We're building Bondhu for you. Share feedback: In-app feedback button, Email: feedback@bondhu.tech, Twitter/Instagram: @bondhu.tech, or Join our community Discord (link on website footer).",
        },
        {
            question: "Who built Bondhu?",
            answer: "Bondhu is built by Gen Z students specializing in AI/ML for Gen Z mental health struggles. We're passionate about making quality mental wellness support accessible to everyone in India.",
        },
        {
            question: "Is Bondhu affiliated with any mental health organization?",
            answer: "We collaborate with mental health professionals and organizations to ensure our AI provides safe, evidence-based support. We're not affiliated with any specific therapy practice or pharmaceutical company.",
        },
        {
            question: "What features are coming soon?",
            answer: "Q4 2025: Mobile apps (iOS/Android), Group support features, Therapist referral network. 2026: Voice conversations, Family sharing, Integration with wearables (mood tracking via Apple Watch/Fitbit), and Journaling with AI insights.",
        },
    ];
    
    return (
        <section className="py-20 bg-secondary/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to know about Bondhu
                    </p>
                </motion.div>
                
                <div className="max-w-4xl mx-auto">
                    {faqs.map((faq, index) => (
                        <motion.div 
                            className="border-b border-border py-6 cursor-pointer transition-colors hover:bg-accent/50 rounded-lg px-4"
                            key={index} 
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-foreground">
                                    {faq.question}
                                </h3>
                                <svg 
                                    width="20" 
                                    height="20" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className={`${openIndex === index ? "rotate-180" : ""} transition-transform duration-300 ease-in-out text-foreground`}
                                >
                                    <path 
                                        d="M6 9L12 15L18 9" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <p className={`text-muted-foreground transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? "opacity-100 max-h-[1000px] mt-4" : "opacity-0 max-h-0"}`}>
                                {faq.answer}
                            </p>
                        </motion.div>
                    ))}
                </div>
                
                <motion.div 
                    className="text-center mt-12 pt-8 border-t border-border"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    viewport={{ once: true }}
                >
                    <p className="text-muted-foreground mb-4">Still have questions?</p>
                    <p className="text-foreground">
                        Contact us at <a href="mailto:bondhuaitech@gmail.com" className="text-primary hover:underline">bondhuaitech@gmail.com</a>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}