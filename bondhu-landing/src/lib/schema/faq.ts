/**
 * FAQ Schema for Bondhu
 * Structured data for frequently asked questions to enable rich snippets
 */

import type { FAQPageSchema } from './types';

export function getBondhuFAQSchema(): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Bondhu?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bondhu is an AI-powered mental health companion designed specifically for Gen Z in India. The name "Bondhu" means "friend" in Bengali, reflecting our mission to be your trusted digital companion for mental wellness. Unlike generic mental health apps, Bondhu understands your unique personality through your music preferences, gaming habits, and entertainment choices to provide truly personalized support.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Bondhu a replacement for therapy or medication?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Bondhu is a mental wellness companion, not a substitute for professional mental health treatment. While we can help with stress management, mood tracking, and daily emotional support, we strongly encourage seeking professional help for severe depression, anxiety disorders, suicidal thoughts, or any condition requiring medication. Think of Bondhu as your first step towards mental wellness or a supplement to professional therapy.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Bondhu understand my personality?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bondhu uses advanced multi-agent AI architecture powered by four specialized intelligence agents: Music Intelligence Agent (analyzes your Spotify listening habits), Video Intelligence Agent (understands your entertainment preferences), Gaming Intelligence Agent (examines your Steam gaming patterns), and Personality Analysis Agent (synthesizes all data using the Big Five personality model). This comprehensive approach helps Bondhu understand not just what you say, but who you are.',
        },
      },
      {
        '@type': 'Question',
        name: 'What makes Bondhu different from other mental health apps?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most mental health apps use generic, one-size-fits-all approaches. Bondhu is different because: Culturally aware (understands Indian family dynamics, social pressures, and cultural context), Personality-driven (adapts conversations based on your unique personality traits), Multi-modal analysis (uses your entertainment preferences to build a complete picture), Proactive support (reaches out when patterns suggest you might need help), and Always learning (continuously updates its understanding as you grow and change).',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my data safe with Bondhu?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely. Privacy is our top priority: End-to-end encryption for all conversations, GDPR-compliant data handling practices, Zero third-party data selling - your information is never shared or sold, Secure storage on enterprise-grade Supabase infrastructure, and You own your data - export or delete anytime.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Bondhu free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Bondhu is 100% free for all users at launch. We\'re committed to making mental health support accessible, especially recognizing that many students and young adults can\'t afford expensive therapy. Our free tier will always remain available with core features. In the future, we may introduce a premium tier (₹299/month) with advanced features, but the core Bondhu experience will always be free.',
        },
      },
      {
        '@type': 'Question',
        name: 'When is Bondhu launching?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bondhu is launching on October 10, 2025 — World Mental Health Day.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to connect my Spotify, Steam, or other accounts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Connections are optional but highly recommended. The more data Bondhu has about your preferences, the better it can understand and support you. All integrations are: Secure (OAuth-based authentication, industry-standard encryption), Private (your data never leaves our secure servers), and Controllable (disconnect anytime without losing your chat history).',
        },
      },
      {
        '@type': 'Question',
        name: 'What can I talk to Bondhu about?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bondhu is here for a wide range of mental health topics: Academic stress and exam anxiety, Family and relationship issues, Career confusion and pressure, Social anxiety and loneliness, Self-esteem and body image, Daily mood tracking, Coping strategies for stress, and Goal setting and motivation. Bondhu cannot help with: Medical emergencies, suicidal crises (please call 9152987821 - AASRA helpline), substance abuse requiring detox, or severe psychiatric conditions requiring medication.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Bondhu work in Hindi or other Indian languages?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Bondhu supports all major Indian languages (22 scheduled languages) and major international languages.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can Bondhu recognize when I\'m in crisis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Bondhu\'s AI is trained to identify concerning patterns like: Expressions of self-harm or suicidal ideation, Severe anxiety or panic attacks, Symptoms of clinical depression, and Substance abuse indicators. When detected, Bondhu will: Provide immediate crisis resources (helpline numbers), Encourage seeking professional help, and Offer grounding exercises while you wait for support.',
        },
      },
      {
        '@type': 'Question',
        name: 'What devices does Bondhu work on?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bondhu is available as a web app (access from any browser at bondhu.tech - best experience on desktop) and mobile app (coming soon for iOS and Android in Q1 2026). The web app is fully responsive and works perfectly on mobile browsers.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I sign up?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '1. Visit bondhu.tech, 2. Create account with email, 3. Complete brief personality assessment (5 minutes), 4. Start chatting!',
        },
      },
      {
        '@type': 'Question',
        name: 'What if I\'m in immediate danger or crisis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Please seek immediate help: India Crisis Helplines: AASRA: 9152987821 (24/7), iCall: 9152987821, Vandrevala Foundation: 1860-2662-345, Emergency: 112 (Police). International: US: 988 (Suicide & Crisis Lifeline), UK: 116 123 (Samaritans). Bondhu will also provide these resources if it detects crisis language.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who built Bondhu?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Bondhu is built by Gen Z students specializing in AI/ML for Gen Z mental health struggles. We\'re passionate about making quality mental wellness support accessible to everyone in India.',
        },
      },
    ],
  };
}

/**
 * Get FAQ schema for specific categories
 */
export function getCategoryFAQSchema(category: 'privacy' | 'features' | 'pricing' | 'technical'): FAQPageSchema {
  const allFAQs = getBondhuFAQSchema();
  
  const categoryMap: Record<string, number[]> = {
    privacy: [4, 7], // Data safety, connections
    features: [2, 3, 8, 10], // Personality understanding, differences, topics, crisis detection
    pricing: [5], // Is Bondhu free
    technical: [11, 12], // Devices, sign up
  };
  
  const indices = categoryMap[category] || [];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: indices.map(i => allFAQs.mainEntity[i]).filter(Boolean),
  };
}
