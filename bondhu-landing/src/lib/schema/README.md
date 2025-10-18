# Schema Markup Library

Comprehensive schema.org structured data implementation for Bondhu.

## 📚 Overview

This directory contains all schema markup utilities for SEO optimization. Each file implements specific schema.org types with full TypeScript typing.

## 📁 Files

### Core Schema Types

- **`types.ts`** - TypeScript type definitions for all schema types
- **`software-app.ts`** - SoftwareApplication schema (Bondhu app)
- **`organization.ts`** - Organization and brand identity
- **`medical-service.ts`** - MedicalBusiness and health services
- **`faq.ts`** - FAQPage with structured Q&A
- **`agents.ts`** - Product schemas for 4 AI agents
- **`how-to.ts`** - HowTo guides and tutorials
- **`webpage.ts`** - WebPage and breadcrumb schemas
- **`utils.ts`** - Helper functions
- **`index.ts`** - Central exports

## 🚀 Quick Start

### Import Schemas

```typescript
// Import specific schemas
import { 
  getBondhuAppSchema,
  getBondhuOrganizationSchema,
  getMentalHealthServiceSchema,
  getBondhuFAQSchema
} from '@/lib/schema';

// Or import from specific files
import { getBondhuAppSchema } from '@/lib/schema/software-app';
```

### Use in Components

```tsx
export default function Page() {
  const schema = getBondhuAppSchema();
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Page content */}
    </>
  );
}
```

### Use Helper Functions

```typescript
import { getGlobalSchemas, getHomepageSchemas } from '@/lib/schema';

// Get all global schemas (for root layout)
const globalSchemas = getGlobalSchemas();

// Get homepage-specific schemas
const homepageSchemas = getHomepageSchemas();
```

## 📖 Schema Types

### SoftwareApplication
Defines Bondhu as a health application.

```typescript
import { getBondhuAppSchema } from '@/lib/schema/software-app';
const schema = getBondhuAppSchema();
```

**Includes:**
- App name, description, category
- Pricing and offers
- Ratings and reviews
- Features list
- Platform availability
- Language support

### Organization
Brand identity and contact information.

```typescript
import { getBondhuOrganizationSchema } from '@/lib/schema/organization';
const schema = getBondhuOrganizationSchema();
```

**Includes:**
- Company name and logo
- Contact information
- Social media profiles
- Founding information
- Address

### MedicalBusiness
Mental health services and specialties.

```typescript
import { getMentalHealthServiceSchema } from '@/lib/schema/medical-service';
const schema = getMentalHealthServiceSchema();
```

**Includes:**
- Medical specialties
- Available services (6 types)
- Service descriptions
- Area served

### FAQPage
Structured Q&A for rich snippets.

```typescript
import { getBondhuFAQSchema, getCategoryFAQSchema } from '@/lib/schema/faq';

// All FAQs
const allFAQs = getBondhuFAQSchema();

// Category-specific
const privacyFAQs = getCategoryFAQSchema('privacy');
```

**Includes:**
- 15+ frequently asked questions
- Structured answers
- Category filtering

### Product (AI Agents)
Individual schemas for each AI agent.

```typescript
import { 
  getAgentProductSchema,
  getAllAgentSchemas,
  getMultiAgentSystemSchema 
} from '@/lib/schema/agents';

// Single agent
const personalityAgent = getAgentProductSchema('personality');

// All agents
const allAgents = getAllAgentSchemas();

// Multi-agent system
const system = getMultiAgentSystemSchema();
```

**Agent Types:**
- `'personality'` - Personality Intelligence Agent
- `'music'` - Music Intelligence Agent
- `'content'` - Content Intelligence Agent
- `'gaming'` - Gaming Intelligence Agent

### HowTo
Step-by-step guides.

```typescript
import { 
  getGettingStartedSchema,
  getBuildPersonalityProfileSchema,
  getConnectSpotifySchema 
} from '@/lib/schema/how-to';
```

**Available Guides:**
- Getting started with Bondhu
- Building personality profile
- Connecting Spotify

### WebPage
Page-specific schemas with breadcrumbs.

```typescript
import { 
  getHomePageSchema,
  getChatPageSchema,
  getPersonalityInsightsPageSchema,
  getBreadcrumbSchema
} from '@/lib/schema/webpage';
```

**Available Pages:**
- Homepage
- Chat page
- Personality insights
- Pricing
- Onboarding
- Privacy policy

## 🛠️ Utility Functions

### Render Schemas

```typescript
import { renderSchema, renderSchemas } from '@/lib/schema/utils';

// Single schema
renderSchema(getBondhuAppSchema());

// Multiple schemas
renderSchemas([schema1, schema2, schema3]);
```

### Combine Schemas

```typescript
import { combineSchemas } from '@/lib/schema/utils';

const combined = combineSchemas([
  getBondhuAppSchema(),
  getBondhuOrganizationSchema()
]);
```

### Generate Breadcrumbs

```typescript
import { generateBreadcrumbs } from '@/lib/schema/utils';

const breadcrumbs = generateBreadcrumbs('/dashboard/settings');
// Returns: [
//   { name: 'Home', url: 'https://www.bondhu.tech' },
//   { name: 'Dashboard', url: 'https://www.bondhu.tech/dashboard' },
//   { name: 'Settings', url: 'https://www.bondhu.tech/dashboard/settings' }
// ]
```

### Format Duration

```typescript
import { formatDuration } from '@/lib/schema/utils';

formatDuration(5);   // "PT5M"
formatDuration(90);  // "PT1H30M"
formatDuration(120); // "PT2H"
```

## ✅ Validation

### Run Validation Script

```bash
npx tsx scripts/validate-schemas.ts
```

This will:
- Check all schemas for errors
- Validate required properties
- Check for placeholder values
- Verify URL formats
- Report warnings and errors

### Manual Validation

```typescript
import { validateRequiredProps } from '@/lib/schema/utils';

const schema = getBondhuAppSchema();
const isValid = validateRequiredProps(schema, ['@context', '@type', 'name']);
```

## 📝 Best Practices

### 1. Always Use TypeScript Types
```typescript
import type { SoftwareApplicationSchema } from '@/lib/schema/types';

function getMySchema(): SoftwareApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    // ... TypeScript will enforce correct properties
  };
}
```

### 2. Keep URLs Consistent
Always use `https://www.bondhu.tech` for all URLs.

### 3. Update When Features Change
When app features, pricing, or ratings change, update the relevant schema files.

### 4. Test Before Deploying
```bash
# Validate schemas
npx tsx scripts/validate-schemas.ts

# Build and test
npm run build
npm run start
```

### 5. Monitor After Deployment
- Google Search Console > Enhancements
- Rich Results Test
- Schema.org Validator

## 🔄 Maintenance

### Update App Rating
```typescript
// src/lib/schema/software-app.ts
aggregateRating: {
  '@type': 'AggregateRating',
  ratingValue: '4.9', // Update here
  ratingCount: '500', // Update here
}
```

### Add New FAQ
```typescript
// src/lib/schema/faq.ts
mainEntity: [
  // ... existing FAQs
  {
    '@type': 'Question',
    name: 'New question?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Answer text',
    },
  },
]
```

### Add New HowTo Guide
```typescript
// src/lib/schema/how-to.ts
export function getNewGuideSchema(): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Guide title',
    description: 'Guide description',
    totalTime: 'PT10M',
    step: [/* steps */],
  };
}
```

## 📚 Documentation

- **Implementation Guide:** `/SCHEMA_MARKUP_IMPLEMENTATION.md`
- **Quick Reference:** `/SCHEMA_QUICK_REFERENCE.md`
- **Deployment Checklist:** `/SCHEMA_DEPLOYMENT_CHECKLIST.md`
- **Summary:** `/SCHEMA_IMPLEMENTATION_SUMMARY.md`

## 🔗 External Resources

- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Validator](https://validator.schema.org/)

## 📞 Support

Questions or issues? Email: bondhuaitech@gmail.com

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Production-Ready
