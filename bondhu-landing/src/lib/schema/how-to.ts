/**
 * HowTo Schema for Bondhu
 * Step-by-step guides for getting started and using key features
 */

import type { HowToSchema } from './types';

export function getGettingStartedSchema(): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Get Started with Bondhu',
    description:
      'Complete guide to setting up your Bondhu AI mental health companion account and starting your personalized mental wellness journey',
    totalTime: 'PT10M',
    image: 'https://www.bondhu.tech/guides/getting-started.png',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Visit Bondhu Website',
        text: 'Go to bondhu.tech in your web browser. Bondhu works on all modern browsers including Chrome, Firefox, Safari, and Edge.',
        url: 'https://www.bondhu.tech',
        image: 'https://www.bondhu.tech/guides/step1-visit.png',
      },
      {
        '@type': 'HowToStep',
        name: 'Create Your Account',
        text: 'Click "Get Started" or "Sign Up" button. Enter your email address and create a secure password. Verify your email through the confirmation link sent to your inbox.',
        url: 'https://www.bondhu.tech/sign-up',
        image: 'https://www.bondhu.tech/guides/step2-signup.png',
      },
      {
        '@type': 'HowToStep',
        name: 'Complete Personality Assessment',
        text: 'Take the brief OCEAN Big Five personality assessment (10-15 questions, approximately 5 minutes). Answer honestly for the most accurate personality insights. This helps Bondhu understand your unique traits and adapt its support style.',
        url: 'https://www.bondhu.tech/onboarding',
        image: 'https://www.bondhu.tech/guides/step3-personality.png',
      },
      {
        '@type': 'HowToStep',
        name: 'Connect Your Accounts (Optional)',
        text: 'Optionally connect your Spotify, YouTube, or Steam accounts for deeper personality insights. All connections use secure OAuth authentication and can be disconnected anytime. The more data Bondhu has, the better it can understand and support you.',
        url: 'https://www.bondhu.tech/dashboard/settings',
        image: 'https://www.bondhu.tech/guides/step4-connect.png',
      },
      {
        '@type': 'HowToStep',
        name: 'Start Your First Conversation',
        text: 'Navigate to the chat interface and start talking to Bondhu about anything on your mind. Share your thoughts, feelings, stresses, or just have a casual conversation. Bondhu adapts to your communication style and personality.',
        url: 'https://www.bondhu.tech/dashboard/chat',
        image: 'https://www.bondhu.tech/guides/step5-chat.png',
      },
    ],
  };
}

export function getBuildPersonalityProfileSchema(): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How Bondhu Builds Your Personality Profile',
    description:
      'Understanding how Bondhu\'s multi-agent AI architecture analyzes your data to create a comprehensive personality profile for personalized mental health support',
    totalTime: 'PT15M',
    image: 'https://www.bondhu.tech/guides/personality-building.png',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Take the OCEAN Big Five Assessment',
        text: 'Complete the scientifically-validated Big Five Inventory-2 (BFI-2) XS personality test. This measures your levels of Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism - the five fundamental personality dimensions.',
        url: 'https://www.bondhu.tech/onboarding',
      },
      {
        '@type': 'HowToStep',
        name: 'Connect Your Music (Spotify)',
        text: 'Link your Spotify account so the Music Intelligence Agent can analyze your listening habits, favorite genres, playlist patterns, and how music reflects your emotional state and personality traits.',
        url: 'https://www.bondhu.tech/dashboard/settings',
      },
      {
        '@type': 'HowToStep',
        name: 'Connect Your Content (YouTube)',
        text: 'Connect YouTube to let the Content Intelligence Agent understand your entertainment preferences, video themes you resonate with, and how your content choices reflect your personality and coping mechanisms.',
        url: 'https://www.bondhu.tech/dashboard/settings',
      },
      {
        '@type': 'HowToStep',
        name: 'Connect Your Gaming (Steam)',
        text: 'Link your Steam account for the Gaming Intelligence Agent to analyze your game preferences, play patterns, competitive vs. cooperative tendencies, and how gaming reflects your personality and stress management.',
        url: 'https://www.bondhu.tech/dashboard/settings',
      },
      {
        '@type': 'HowToStep',
        name: 'Have Conversations with Bondhu',
        text: 'Chat regularly with Bondhu. The Personality Analysis Agent learns from your conversation patterns, communication style, emotional expressions, and topics you discuss to continuously refine your personality profile.',
        url: 'https://www.bondhu.tech/dashboard/chat',
      },
      {
        '@type': 'HowToStep',
        name: 'Review Your Personality Insights',
        text: 'Visit your Personality Insights dashboard to see how Bondhu understands you. View your Big Five scores, personality traits, emotional patterns, and how the multi-agent system synthesizes all your data.',
        url: 'https://www.bondhu.tech/personality-insights',
      },
    ],
  };
}

export function getConnectSpotifySchema(): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Connect Spotify to Bondhu',
    description:
      'Step-by-step guide to securely connecting your Spotify account for music-based personality insights',
    totalTime: 'PT3M',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Go to Settings',
        text: 'Navigate to your Bondhu dashboard and click on Settings or Integrations.',
        url: 'https://www.bondhu.tech/dashboard/settings',
      },
      {
        '@type': 'HowToStep',
        name: 'Click Connect Spotify',
        text: 'Find the Spotify integration card and click "Connect Spotify" button.',
      },
      {
        '@type': 'HowToStep',
        name: 'Authorize Bondhu',
        text: 'You\'ll be redirected to Spotify\'s secure login page. Log in with your Spotify credentials and authorize Bondhu to access your listening data. Bondhu uses OAuth 2.0 for secure authentication.',
      },
      {
        '@type': 'HowToStep',
        name: 'Wait for Analysis',
        text: 'Bondhu\'s Music Intelligence Agent will analyze your listening history, playlists, and preferences. This usually takes 1-2 minutes.',
      },
      {
        '@type': 'HowToStep',
        name: 'View Music Insights',
        text: 'Check your Personality Insights dashboard to see how your music preferences contribute to your overall personality profile.',
        url: 'https://www.bondhu.tech/personality-insights',
      },
    ],
  };
}

/**
 * Get all HowTo schemas
 */
export function getAllHowToSchemas(): HowToSchema[] {
  return [
    getGettingStartedSchema(),
    getBuildPersonalityProfileSchema(),
    getConnectSpotifySchema(),
  ];
}
