# Schema Markup Implementation Guide for Bondhu

## 🎯 Objective
Boost Schema Markup score from **40/100 to 90+** through comprehensive structured data implementation.

## 📊 Current Implementation Status

### ✅ Completed Schema Types

1. **SoftwareApplication Schema** (`/lib/schema/software-app.ts`)
   - Defines Bondhu as a HealthApplication
   - Includes pricing, ratings, features, and availability
   - Multi-language and multi-platform support

2. **Organization Schema** (`/lib/schema/organization.ts`)
   - Brand identity and contact information
   - Social media profiles
   - Founder information

3. **MedicalBusiness Schema** (`/lib/schema/medical-service.ts`)
   - Mental health service definitions
   - Available therapies and assessments
   - Medical specialties and disclaimers

4. **FAQ Schema** (`/lib/schema/faq.ts`)
   - 15+ frequently asked questions
   - Structured Q&A for rich snippets
   - Category-specific FAQ subsets

5. **Product Schema for AI Agents** (`/lib/schema/agents.ts`)
   - Personality Intelligence Agent
   - Music Intelligence Agent
   - Content Intelligence Agent
   - Gaming Intelligence Agent
   - Multi-agent system ItemList

6. **HowTo Schema** (`/lib/schema/how-to.ts`)
   - Getting started guide
   - Building personality profile
   - Connecting Spotify/integrations

7. **WebPage & WebSite Schema** (`/lib/schema/webpage.ts`)
   - Homepage, chat, personality insights pages
   - Breadcrumb navigation
   - Site-wide search action

## 🏗️ Architecture

```
src/lib/schema/
├── types.ts              # TypeScript type definitions
├── software-app.ts       # SoftwareApplication schema
├── organization.ts       # Organization & LocalBusiness
├── medical-service.ts    # MedicalBusiness & health services
├── faq.ts               # FAQPage schema
├── agents.ts            # Product schemas for 4 AI agents
├── how-to.ts            # HowTo guides
├── webpage.ts           # WebPage & breadcrumb schemas
└── index.ts             # Central exports & utilities
```

## 🚀 Implementation

### Root Layout (Global Schemas)
**File:** `src/app/layout.tsx`

Global schemas added to every page:
- SoftwareApplication
- Organization
- WebSite

```tsx
import { getGlobalSchemas } from "@/lib/schema";

const globalSchemas = getGlobalSchemas();
// Rendered in <head> as JSON-LD
```

### Homepage (Page-Specific Schemas)
**File:** `src/app/page.tsx` + `src/app/page-schemas.tsx`

Additional schemas for homepage:
- WebPage (homepage)
- MedicalBusiness
- FAQPage (all FAQs)
- Multi-Agent System (ItemList)
- HowTo (Getting Started)

### Page-Specific Implementation Pattern

For any page requiring custom schemas:

```tsx
// 1. Create schema component
export function PageSchemas() {
  const schemas = [
    getPageSpecificSchema(),
    // ... other schemas
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

// 2. Add to page
export default function Page() {
  return (
    <>
      <PageSchemas />
      {/* Page content */}
    </>
  );
}
```

## 📄 Schema by Page

| Page | Schemas Applied |
|------|----------------|
| **Homepage** (`/`) | SoftwareApplication, Organization, WebSite, WebPage, MedicalBusiness, FAQPage, Multi-Agent System, HowTo |
| **Chat** (`/dashboard/chat`) | WebPage, Breadcrumb |
| **Personality Insights** (`/personality-insights`) | WebPage, Breadcrumb, Product (agents) |
| **Onboarding** (`/onboarding`) | WebPage, HowTo (personality building) |
| **Pricing** (`/#pricing`) | WebPage, Offer details |
| **Privacy Policy** (`/privacy-policy`) | WebPage, Breadcrumb |

## 🔍 Validation & Testing

### 1. Google Rich Results Test
**URL:** https://search.google.com/test/rich-results

**Test URLs:**
- Homepage: `https://www.bondhu.tech`
- FAQ section: `https://www.bondhu.tech/#faq`

**Expected Results:**
- ✅ SoftwareApplication rich snippet
- ✅ FAQ rich snippet (expandable Q&A)
- ✅ Organization knowledge panel
- ✅ HowTo rich snippet

### 2. Schema.org Validator
**URL:** https://validator.schema.org/

**Validation Steps:**
1. Copy page source HTML
2. Paste into validator
3. Check for errors/warnings
4. Verify all schemas are recognized

### 3. Google Search Console
**Path:** Search Console > Enhancements > Rich Results

**Monitor:**
- Valid items count
- Errors/warnings
- Impressions for rich results
- Click-through rates

### 4. Manual Testing Checklist

```bash
# Test in development
npm run dev

# View page source and search for:
<script type="application/ld+json">
```

**Verify:**
- [ ] All JSON-LD scripts are present
- [ ] No JavaScript errors in console
- [ ] Schemas are valid JSON
- [ ] No duplicate schemas
- [ ] All URLs use https://www.bondhu.tech

## 🎨 SEO Optimization Features

### Keywords Targeted
- "AI mental health companion"
- "personality-based AI chatbot"
- "Gen Z mental health app"
- "AI therapy companion India"
- "adaptive mental health support"
- "personality assessment AI"
- "OCEAN Big 5 personality test"

### Metadata Enhancements
**File:** `src/app/layout.tsx`

✅ **Implemented:**
- Comprehensive title templates
- Rich descriptions with keywords
- OpenGraph tags for social sharing
- Twitter Card metadata
- Canonical URLs
- Robots directives
- Google Search Console verification placeholder

### Rich Snippet Opportunities

1. **FAQ Rich Snippets**
   - Expandable Q&A in search results
   - Increased visibility for common questions
   - Higher CTR

2. **SoftwareApplication Rich Snippets**
   - App rating stars in search
   - Price information
   - Platform availability
   - Download/access buttons

3. **HowTo Rich Snippets**
   - Step-by-step guides in search
   - Visual step indicators
   - Estimated time

4. **Organization Knowledge Panel**
   - Brand logo
   - Social media links
   - Contact information
   - Company description

## 🔧 Maintenance Guide

### Adding New Schemas

1. **Define Types** (if needed)
```typescript
// src/lib/schema/types.ts
export interface NewSchema extends SchemaBase {
  '@type': 'NewType';
  // ... properties
}
```

2. **Create Schema Function**
```typescript
// src/lib/schema/new-schema.ts
export function getNewSchema(): NewSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewType',
    // ... properties
  };
}
```

3. **Export from Index**
```typescript
// src/lib/schema/index.ts
export * from './new-schema';
```

4. **Add to Page**
```tsx
import { getNewSchema } from '@/lib/schema';
// Add to schemas array
```

### Updating Existing Schemas

**When to Update:**
- New features launched
- Pricing changes
- Contact information updates
- New integrations added
- Rating/review count increases

**Example: Update App Rating**
```typescript
// src/lib/schema/software-app.ts
aggregateRating: {
  '@type': 'AggregateRating',
  ratingValue: '4.9', // Update this
  ratingCount: '500', // Update this
}
```

### Schema Evolution Checklist

When features evolve:
- [ ] Update relevant schema files
- [ ] Test with validators
- [ ] Update documentation
- [ ] Verify no breaking changes
- [ ] Monitor Search Console for errors

## 📈 Expected Impact

### Before Implementation
- Schema Markup Score: **40/100**
- Limited rich snippet eligibility
- No FAQ rich results
- No app rating display

### After Implementation
- Schema Markup Score: **90+/100**
- FAQ rich snippets enabled
- SoftwareApplication rich results
- HowTo rich snippets
- Organization knowledge panel
- Enhanced search visibility

### Performance Considerations

✅ **Optimizations Applied:**
- Schemas in `<head>` for fast parsing
- JSON-LD format (recommended by Google)
- No blocking JavaScript
- Minimal performance impact
- Maintains 89/100 performance score

## 🐛 Troubleshooting

### Common Issues

**Issue:** Schemas not appearing in Rich Results Test
- **Solution:** Wait 24-48 hours after deployment
- **Solution:** Ensure robots.txt allows Googlebot
- **Solution:** Submit sitemap to Search Console

**Issue:** Validation errors
- **Solution:** Check JSON syntax
- **Solution:** Verify all required properties
- **Solution:** Use TypeScript types to prevent errors

**Issue:** Duplicate schemas
- **Solution:** Check global vs. page-specific schemas
- **Solution:** Remove redundant schema calls

**Issue:** Performance degradation
- **Solution:** Lazy load page-specific schemas
- **Solution:** Minimize schema size
- **Solution:** Use server-side rendering

## 📞 Support & Resources

### Official Documentation
- [Schema.org](https://schema.org/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [JSON-LD Specification](https://json-ld.org/)

### Testing Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
- [Google Search Console](https://search.google.com/search-console)

### Bondhu-Specific
- **Email:** bondhuaitech@gmail.com
- **Documentation:** This file
- **Schema Files:** `/src/lib/schema/`

## 🎯 Next Steps

1. **Deploy to Production**
   ```bash
   npm run build
   npm run start
   ```

2. **Submit to Google Search Console**
   - Add property
   - Verify ownership
   - Submit sitemap
   - Request indexing

3. **Monitor Results**
   - Check Rich Results report (weekly)
   - Track search impressions
   - Monitor CTR improvements
   - Watch for errors/warnings

4. **Iterate & Improve**
   - Add more HowTo guides
   - Expand FAQ coverage
   - Add video schemas (when available)
   - Implement review schemas (when available)

## 📝 Version History

- **v1.0.0** (Current) - Initial comprehensive implementation
  - All 7 schema types implemented
  - Global and page-specific schemas
  - Full TypeScript typing
  - Validation documentation

---

**Last Updated:** January 2025  
**Maintained By:** Bondhu Team  
**Schema Markup Score Target:** 90+/100
