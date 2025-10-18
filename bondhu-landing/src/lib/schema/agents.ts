/**
 * Product Schema for Bondhu's 4 AI Agents
 * Each agent is represented as a distinct product/feature
 */

import type { ProductSchema } from './types';

export type AgentType = 'personality' | 'music' | 'content' | 'gaming';

export function getAgentProductSchema(agentType: AgentType): ProductSchema {
  const agents: Record<AgentType, ProductSchema> = {
    personality: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Personality Intelligence Agent',
      description:
        'Advanced AI agent that analyzes and synthesizes personality data using the scientifically-validated OCEAN Big Five personality model (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism). Integrates data from multiple sources including the BFI-2 XS personality test, conversation patterns, and behavioral data from music, gaming, and content preferences to build a comprehensive personality profile.',
      brand: {
        '@type': 'Brand',
        name: 'Bondhu',
      },
      category: 'AI Agent - Personality Analysis',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Included in Bondhu free tier',
        availability: 'https://schema.org/PreOrder',
      },
      url: 'https://www.bondhu.tech/#features',
    },
    music: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Music Intelligence Agent',
      description:
        'Specialized AI agent that analyzes Spotify listening habits, music preferences, genre patterns, and emotional connections to music. Understands how your music choices reflect your emotional state, personality traits, and mental wellness patterns. Provides insights into mood regulation through music and identifies emotional triggers.',
      brand: {
        '@type': 'Brand',
        name: 'Bondhu',
      },
      category: 'AI Agent - Music Analysis',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Included in Bondhu free tier with Spotify integration',
        availability: 'https://schema.org/PreOrder',
      },
      url: 'https://www.bondhu.tech/#features',
    },
    content: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Content Intelligence Agent',
      description:
        'AI agent that analyzes YouTube viewing patterns, content preferences, and entertainment choices to understand personality traits and emotional needs. Identifies themes in consumed content, emotional resonance patterns, and how entertainment choices reflect mental state and coping mechanisms.',
      brand: {
        '@type': 'Brand',
        name: 'Bondhu',
      },
      category: 'AI Agent - Content Analysis',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Included in Bondhu free tier with YouTube integration',
        availability: 'https://schema.org/PreOrder',
      },
      url: 'https://www.bondhu.tech/#features',
    },
    gaming: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Gaming Intelligence Agent',
      description:
        'AI agent that examines Steam gaming behavior, game genre preferences, play patterns, and gaming habits to understand personality traits, stress coping mechanisms, and social interaction patterns. Analyzes how gaming choices reflect emotional needs, competitive vs. cooperative tendencies, and escapism patterns.',
      brand: {
        '@type': 'Brand',
        name: 'Bondhu',
      },
      category: 'AI Agent - Gaming Analysis',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Included in Bondhu free tier with Steam integration',
        availability: 'https://schema.org/PreOrder',
      },
      url: 'https://www.bondhu.tech/#features',
    },
  };

  return agents[agentType];
}

/**
 * Get all agent schemas as an array
 */
export function getAllAgentSchemas(): ProductSchema[] {
  return [
    getAgentProductSchema('personality'),
    getAgentProductSchema('music'),
    getAgentProductSchema('content'),
    getAgentProductSchema('gaming'),
  ];
}

/**
 * Multi-agent system schema (ItemList)
 */
export function getMultiAgentSystemSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Bondhu Multi-Agent AI Architecture',
    description:
      'Four specialized AI agents working together to provide comprehensive personality-based mental health support',
    numberOfItems: 4,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: getAgentProductSchema('personality'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: getAgentProductSchema('music'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        item: getAgentProductSchema('content'),
      },
      {
        '@type': 'ListItem',
        position: 4,
        item: getAgentProductSchema('gaming'),
      },
    ],
  };
}
