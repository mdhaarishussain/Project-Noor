/**
 * Organization Schema for Bondhu
 * Brand identity, contact information, and social media profiles
 */

import type { OrganizationSchema } from './types';

export function getBondhuOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bondhu',
    url: 'https://www.bondhu.tech',
    logo: 'https://www.bondhu.tech/Light mode logo.svg',
    description:
      'Bondhu is an AI-powered mental health companion platform designed for Gen Z in India. We use advanced multi-agent AI architecture to provide personalized, culturally-aware mental wellness support through personality-based adaptive learning.',
    foundingDate: '2025',
    founders: [
      {
        '@type': 'Person',
        name: 'Bondhu Team',
        jobTitle: 'Founders',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        email: 'bondhuaitech@gmail.com',
        availableLanguage: ['English', 'Hindi', 'Bengali'],
        areaServed: 'IN',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Technical Support',
        email: 'bondhuaitech@gmail.com',
        availableLanguage: ['English'],
        areaServed: 'IN',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Sales',
        email: 'team@bondhu.tech',
        availableLanguage: ['English', 'Hindi'],
        areaServed: 'IN',
      },
    ],
    sameAs: [
      'https://twitter.com/bondhu.tech',
      'https://instagram.com/bondhu.tech',
      'https://linkedin.com/company/bondhu',
      'https://github.com/bondhu-tech',
    ],
    email: 'bondhuaitech@gmail.com',
  };
}

/**
 * LocalBusiness schema variant for Bondhu (if needed for local SEO)
 */
export function getBondhuLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://www.bondhu.tech/#organization',
    name: 'Bondhu',
    image: 'https://www.bondhu.tech/Light mode logo.svg',
    url: 'https://www.bondhu.tech',
    telephone: '+91-XXXXXXXXXX', // Add when available
    email: 'bondhuaitech@gmail.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      // Add coordinates when physical location is available
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
    priceRange: 'Free - ₹299',
  };
}
