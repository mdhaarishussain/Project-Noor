/**
 * Homepage Schema Component
 * Renders all homepage-specific schemas including FAQ, Medical Service, and Multi-Agent System
 */

import { getMentalHealthServiceSchema } from '@/lib/schema/medical-service';
import { getBondhuFAQSchema } from '@/lib/schema/faq';
import { getMultiAgentSystemSchema } from '@/lib/schema/agents';
import { getGettingStartedSchema } from '@/lib/schema/how-to';
import { getHomePageSchema } from '@/lib/schema/webpage';

export function HomePageSchemas() {
  const schemas = [
    getHomePageSchema(),
    getMentalHealthServiceSchema(),
    getBondhuFAQSchema(),
    getMultiAgentSystemSchema(),
    getGettingStartedSchema(),
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`homepage-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
