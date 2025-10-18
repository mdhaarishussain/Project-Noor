/**
 * SoftwareApplication Schema for Bondhu
 * Defines Bondhu as a health application with comprehensive metadata
 */

import type { SoftwareApplicationSchema } from './types';

export function getBondhuAppSchema(): SoftwareApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Bondhu - AI Mental Health Companion',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web, iOS (coming soon), Android (coming soon)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free beta access with core features. Premium tier coming soon at ₹299/month',
      availability: 'https://schema.org/PreOrder',
      validFrom: '2025-10-10',
    },
    description:
      'Bondhu is an AI-powered mental health companion that adapts to your personality through interactive analysis of your music preferences, gaming habits, and entertainment choices. Using advanced multi-agent AI architecture with 4 specialized intelligence agents (Personality, Music, Gaming, Content), Bondhu provides personalized mental wellness support for Gen Z in India. Features include OCEAN Big 5 personality assessment, proactive mood tracking, 24/7 availability, culturally-aware conversations, and end-to-end encrypted messaging.',
    url: 'https://www.bondhu.tech',
    image: 'https://www.bondhu.tech/og-image.png',
    softwareVersion: '1.0.0',
    releaseNotes: 'Launch version with core AI companion features, personality assessment, and multi-agent architecture',
    featureList: [
      'AI-powered mental health conversations',
      'OCEAN Big 5 personality assessment',
      'Multi-agent AI architecture (4 specialized agents)',
      'Spotify music preference analysis',
      'Steam gaming behavior analysis',
      'YouTube content preference analysis',
      'Proactive mood tracking and check-ins',
      'Culturally-aware support for Indian Gen Z',
      'End-to-end encrypted messaging',
      '24/7 availability',
      'Crisis detection and resource provision',
      'Multi-language support (22+ Indian languages)',
      'Adaptive conversation style based on personality',
      'Goal setting and progress tracking',
    ],
    author: {
      '@type': 'Organization',
      name: 'Bondhu Team',
      url: 'https://www.bondhu.tech/team',
    },
    provider: {
      '@type': 'Organization',
      name: 'Bondhu',
      url: 'https://www.bondhu.tech',
    },
    availableOnDevice: 'Desktop, Mobile Web Browser',
    countriesSupported: ['IN'],
    inLanguage: [
      'en',
      'hi',
      'bn',
      'ta',
      'te',
      'mr',
      'gu',
      'kn',
      'ml',
      'pa',
      'or',
      'as',
      'ur',
    ],
  };
}

/**
 * Get schema for mobile app (when launched)
 */
export function getBondhuMobileAppSchema(platform: 'iOS' | 'Android'): SoftwareApplicationSchema {
  const baseSchema = getBondhuAppSchema();
  
  return {
    ...baseSchema,
    operatingSystem: platform,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free download with in-app premium features',
      availability: 'https://schema.org/PreOrder',
    },
    url: platform === 'iOS' 
      ? 'https://apps.apple.com/app/bondhu' 
      : 'https://play.google.com/store/apps/details?id=tech.bondhu.app',
  };
}
