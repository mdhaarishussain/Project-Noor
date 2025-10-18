# Schema Markup Quick Reference

## 🚀 Quick Start

### Import Schemas
```typescript
import { 
  getBondhuAppSchema,
  getBondhuOrganizationSchema,
  getMentalHealthServiceSchema,
  getBondhuFAQSchema,
  getAgentProductSchema,
  getGettingStartedSchema,
  getHomePageSchema
} from '@/lib/schema';
```

### Add to Page
```tsx
export function PageSchemas() {
  const schemas = [getYourSchema()];
  
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
```

## 📋 Available Schemas

### Global (Every Page)
```typescript
import { getGlobalSchemas } from '@/lib/schema';
// Returns: [SoftwareApplication, Organization, WebSite]
```

### Homepage
```typescript
import { getHomepageSchemas } from '@/lib/schema';
// Returns: Global + MedicalBusiness + FAQ + Multi-Agent + HowTo
```

### Individual Schemas

#### SoftwareApplication
```typescript
import { getBondhuAppSchema } from '@/lib/schema/software-app';
const schema = getBondhuAppSchema();
```

#### Organization
```typescript
import { getBondhuOrganizationSchema } from '@/lib/schema/organization';
const schema = getBondhuOrganizationSchema();
```

#### Medical Service
```typescript
import { getMentalHealthServiceSchema } from '@/lib/schema/medical-service';
const schema = getMentalHealthServiceSchema();
```

#### FAQ
```typescript
import { getBondhuFAQSchema, getCategoryFAQSchema } from '@/lib/schema/faq';

// All FAQs
const allFAQs = getBondhuFAQSchema();

// Category-specific
const privacyFAQs = getCategoryFAQSchema('privacy');
const featureFAQs = getCategoryFAQSchema('features');
const pricingFAQs = getCategoryFAQSchema('pricing');
const technicalFAQs = getCategoryFAQSchema('technical');
```

#### AI Agents (Products)
```typescript
import { 
  getAgentProductSchema, 
  getAllAgentSchemas,
  getMultiAgentSystemSchema 
} from '@/lib/schema/agents';

// Single agent
const personalityAgent = getAgentProductSchema('personality');
const musicAgent = getAgentProductSchema('music');
const contentAgent = getAgentProductSchema('content');
const gamingAgent = getAgentProductSchema('gaming');

// All agents
const allAgents = getAllAgentSchemas();

// Multi-agent system (ItemList)
const system = getMultiAgentSystemSchema();
```

#### HowTo Guides
```typescript
import { 
  getGettingStartedSchema,
  getBuildPersonalityProfileSchema,
  getConnectSpotifySchema,
  getAllHowToSchemas
} from '@/lib/schema/how-to';

const gettingStarted = getGettingStartedSchema();
const personalityGuide = getBuildPersonalityProfileSchema();
const spotifyGuide = getConnectSpotifySchema();
const allGuides = getAllHowToSchemas();
```

#### WebPage & Breadcrumbs
```typescript
import { 
  getHomePageSchema,
  getChatPageSchema,
  getPersonalityInsightsPageSchema,
  getPricingPageSchema,
  getOnboardingPageSchema,
  getPrivacyPolicyPageSchema,
  getBreadcrumbSchema
} from '@/lib/schema/webpage';

// Specific pages
const homepage = getHomePageSchema();
const chatPage = getChatPageSchema();

// Custom breadcrumb
const breadcrumb = getBreadcrumbSchema([
  { name: 'Home', url: 'https://www.bondhu.tech' },
  { name: 'Dashboard', url: 'https://www.bondhu.tech/dashboard' },
  { name: 'Settings', url: 'https://www.bondhu.tech/dashboard/settings' }
]);
```

## 🎯 Common Use Cases

### Add Schema to New Page

1. **Create page schema file** (optional, for complex pages)
```typescript
// src/app/your-page/page-schemas.tsx
import { getYourSchema } from '@/lib/schema';

export function YourPageSchemas() {
  const schemas = [
    getYourSchema(),
    // Add more schemas
  ];
  
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
```

2. **Add to page component**
```typescript
// src/app/your-page/page.tsx
import { YourPageSchemas } from './page-schemas';

export default function YourPage() {
  return (
    <>
      <YourPageSchemas />
      {/* Page content */}
    </>
  );
}
```

### Update App Rating
```typescript
// src/lib/schema/software-app.ts
aggregateRating: {
  '@type': 'AggregateRating',
  ratingValue: '4.9', // ← Update here
  ratingCount: '500', // ← Update here
}
```

### Add New FAQ
```typescript
// src/lib/schema/faq.ts
mainEntity: [
  // ... existing FAQs
  {
    '@type': 'Question',
    name: 'Your new question?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Your detailed answer here.',
    },
  },
]
```

### Add New HowTo Guide
```typescript
// src/lib/schema/how-to.ts
export function getYourNewGuideSchema(): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Do Something',
    description: 'Guide description',
    totalTime: 'PT5M', // ISO 8601 duration
    step: [
      {
        '@type': 'HowToStep',
        name: 'Step 1',
        text: 'Step description',
        url: 'https://www.bondhu.tech/guide-url',
      },
      // More steps...
    ],
  };
}
```

## 🔍 Validation Commands

### Test Locally
```bash
# Start dev server
npm run dev

# View page source at http://localhost:3000
# Search for: <script type="application/ld+json">
```

### Validate Online
```bash
# 1. Google Rich Results Test
# https://search.google.com/test/rich-results
# Enter: https://www.bondhu.tech

# 2. Schema.org Validator
# https://validator.schema.org/
# Paste page source HTML
```

### Check in Browser Console
```javascript
// Run in browser console
const scripts = document.querySelectorAll('script[type="application/ld+json"]');
scripts.forEach((script, index) => {
  console.log(`Schema ${index + 1}:`, JSON.parse(script.textContent));
});
```

## 📊 Schema Checklist

### Before Deployment
- [ ] All schemas have valid JSON syntax
- [ ] No duplicate schemas
- [ ] All URLs use https://www.bondhu.tech
- [ ] Required properties present
- [ ] TypeScript types match schema.org spec
- [ ] Tested with validators

### After Deployment
- [ ] Submitted sitemap to Search Console
- [ ] Verified in Rich Results Test
- [ ] No errors in Search Console
- [ ] Monitor impressions/clicks
- [ ] Check for rich snippet appearance (2-4 weeks)

## 🎨 Schema Types by Priority

### Critical (Must Have)
1. ✅ SoftwareApplication
2. ✅ Organization
3. ✅ WebSite
4. ✅ FAQPage

### High Priority
5. ✅ MedicalBusiness
6. ✅ WebPage (key pages)
7. ✅ HowTo (getting started)

### Medium Priority
8. ✅ Product (AI agents)
9. ✅ BreadcrumbList

### Future Enhancements
- [ ] VideoObject (when video content available)
- [ ] Review/Rating (when user reviews available)
- [ ] Event (for webinars/launches)
- [ ] Article/BlogPosting (for blog content)

## 🔗 Quick Links

- **Schema Files:** `/src/lib/schema/`
- **Documentation:** `/SCHEMA_MARKUP_IMPLEMENTATION.md`
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema.org Docs:** https://schema.org/
- **Google Search Central:** https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data

## 💡 Pro Tips

1. **Always use TypeScript types** - Prevents schema errors
2. **Test before deploying** - Use validators
3. **Keep schemas updated** - When features change
4. **Monitor Search Console** - Weekly checks
5. **Don't over-optimize** - Only add relevant schemas
6. **Use canonical URLs** - Always https://www.bondhu.tech
7. **Follow Google guidelines** - No spammy markup

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Schema not showing in test | Wait 24-48 hours after deployment |
| Validation errors | Check JSON syntax, verify required fields |
| Duplicate schemas | Remove redundant calls |
| Performance impact | Schemas are lightweight, shouldn't affect performance |
| Rich snippets not appearing | Can take 2-4 weeks, ensure no errors in Search Console |

---

**Need Help?** Email: bondhuaitech@gmail.com
