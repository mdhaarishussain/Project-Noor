/**
 * WebPage and WebSite Schema for Bondhu
 * Structured data for key pages and site-wide search
 */

import type { WebPageSchema, WebSiteSchema, BreadcrumbListSchema } from './types';

export function getBondhuWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bondhu - AI Mental Health Companion',
    url: 'https://www.bondhu.tech',
    description:
      'AI-powered mental health companion for Gen Z in India. Personalized support through multi-agent AI architecture analyzing personality, music, gaming, and content preferences.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.bondhu.tech/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getHomePageSchema(): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Bondhu - AI Mental Health Companion for Gen Z',
    description:
      'Meet your digital বন্ধু - an AI companion that adapts to your personality through music, gaming, and content analysis. Get personalized mental health support 24/7.',
    url: 'https://www.bondhu.tech',
    isPartOf: getBondhuWebSiteSchema(),
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.bondhu.tech',
        },
      ],
    },
  };
}

export function getChatPageSchema(): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Chat with Bondhu - AI Mental Health Conversations',
    description:
      'Have personalized mental health conversations with Bondhu, your AI companion that understands your personality and adapts to your emotional needs.',
    url: 'https://www.bondhu.tech/dashboard/chat',
    isPartOf: getBondhuWebSiteSchema(),
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.bondhu.tech',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Dashboard',
          item: 'https://www.bondhu.tech/dashboard',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Chat',
          item: 'https://www.bondhu.tech/dashboard/chat',
        },
      ],
    },
  };
}

export function getPersonalityInsightsPageSchema(): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Personality Insights - OCEAN Big Five Analysis',
    description:
      'View your comprehensive personality profile based on the Big Five personality model. See how Bondhu\'s multi-agent AI understands your unique traits.',
    url: 'https://www.bondhu.tech/personality-insights',
    isPartOf: getBondhuWebSiteSchema(),
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.bondhu.tech',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Personality Insights',
          item: 'https://www.bondhu.tech/personality-insights',
        },
      ],
    },
  };
}

export function getPricingPageSchema(): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Bondhu Pricing - Free Mental Health Support',
    description:
      'Bondhu is 100% free at launch. Core AI mental health companion features always free. Premium tier coming soon at ₹299/month.',
    url: 'https://www.bondhu.tech/#pricing',
    isPartOf: getBondhuWebSiteSchema(),
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.bondhu.tech',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Pricing',
          item: 'https://www.bondhu.tech/#pricing',
        },
      ],
    },
  };
}

export function getOnboardingPageSchema(): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Get Started with Bondhu - Personality Assessment',
    description:
      'Complete your OCEAN Big Five personality assessment and start your personalized mental health journey with Bondhu.',
    url: 'https://www.bondhu.tech/onboarding',
    isPartOf: getBondhuWebSiteSchema(),
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.bondhu.tech',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Onboarding',
          item: 'https://www.bondhu.tech/onboarding',
        },
      ],
    },
  };
}

export function getPrivacyPolicyPageSchema(): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy - Bondhu Data Protection',
    description:
      'Learn how Bondhu protects your privacy with end-to-end encryption, GDPR compliance, and zero third-party data sharing.',
    url: 'https://www.bondhu.tech/privacy-policy',
    isPartOf: getBondhuWebSiteSchema(),
    breadcrumb: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.bondhu.tech',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Privacy Policy',
          item: 'https://www.bondhu.tech/privacy-policy',
        },
      ],
    },
  };
}

/**
 * Get breadcrumb schema for any page
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
