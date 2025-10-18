/**
 * MedicalBusiness and Health Service Schema for Bondhu
 * Defines mental health services and medical specialties
 */

import type { MedicalBusinessSchema } from './types';

export function getMentalHealthServiceSchema(): MedicalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'Bondhu - AI Mental Health Support',
    description:
      'AI-powered mental wellness companion providing personalized mental health support, mood tracking, stress management, and emotional wellness guidance for Gen Z in India. Not a replacement for professional therapy but a supplementary mental health tool.',
    medicalSpecialty: [
      'Mental Health',
      'Psychology',
      'Counseling',
      'Wellness',
      'Behavioral Health',
    ],
    availableService: [
      {
        '@type': 'MedicalTherapy',
        name: 'AI-Powered Mental Health Conversations',
        description:
          'Personalized mental health support through AI-driven conversations adapted to your personality and emotional needs',
        relevantSpecialty: 'Mental Health',
      },
      {
        '@type': 'MedicalTest',
        name: 'OCEAN Big 5 Personality Assessment',
        description:
          'Comprehensive personality assessment using the scientifically-validated Big Five Inventory-2 (BFI-2) XS test to understand your personality traits',
        relevantSpecialty: 'Psychology',
      },
      {
        '@type': 'MedicalTherapy',
        name: 'Proactive Mood Tracking',
        description:
          'Continuous mood monitoring with AI-driven check-ins and pattern recognition to identify emotional trends and triggers',
        relevantSpecialty: 'Mental Health',
      },
      {
        '@type': 'MedicalTherapy',
        name: 'Stress Management Support',
        description:
          'Evidence-based coping strategies, grounding exercises, and stress reduction techniques tailored to your personality',
        relevantSpecialty: 'Behavioral Health',
      },
      {
        '@type': 'MedicalTherapy',
        name: 'Crisis Detection and Resource Provision',
        description:
          'AI-powered detection of concerning mental health patterns with immediate provision of crisis helpline resources and professional referrals',
        relevantSpecialty: 'Mental Health',
      },
      {
        '@type': 'MedicalTherapy',
        name: 'Goal Setting and Progress Tracking',
        description:
          'Collaborative goal setting for mental wellness with AI-assisted progress tracking and motivational support',
        relevantSpecialty: 'Counseling',
      },
    ],
    url: 'https://www.bondhu.tech',
    priceRange: 'Free - ₹299/month',
    areaServed: ['India'],
  };
}

/**
 * Health and wellness service schema (alternative/supplementary)
 */
export function getHealthWellnessServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Mental Health Support',
    name: 'Bondhu AI Mental Health Companion',
    description:
      'Comprehensive mental wellness support through AI-powered conversations, personality analysis, and proactive emotional care',
    provider: {
      '@type': 'Organization',
      name: 'Bondhu',
      url: 'https://www.bondhu.tech',
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    audience: {
      '@type': 'PeopleAudience',
      suggestedMinAge: 16,
      suggestedMaxAge: 30,
      audienceType: 'Gen Z, Young Adults, Students',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://www.bondhu.tech',
      serviceType: 'Web Application',
      availableLanguage: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'],
    },
    termsOfService: 'https://www.bondhu.tech/terms-of-service',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Free tier with core features, premium tier at ₹299/month',
    },
  };
}

/**
 * Medical disclaimer schema
 */
export function getMedicalDisclaimerSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Bondhu Mental Health Support',
    description: 'AI-powered mental wellness companion',
    disclaimer:
      'Bondhu is a mental wellness companion and not a substitute for professional mental health treatment. For severe depression, anxiety disorders, suicidal thoughts, or conditions requiring medication, please seek professional help. In case of emergency, contact AASRA at 9152987821 or emergency services at 112.',
    medicalAudience: [
      {
        '@type': 'MedicalAudience',
        audienceType: 'Patient',
        healthCondition: 'Mental Health Concerns',
      },
    ],
    reviewedBy: {
      '@type': 'Organization',
      name: 'Mental Health Professionals',
    },
  };
}
