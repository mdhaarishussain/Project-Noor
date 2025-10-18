/**
 * Schema Utility Functions
 * Helper functions for working with schema markup
 */

/**
 * Convert schema to JSON-LD string for script tag
 */
export function schemaToJsonLd(schema: any): string {
  return JSON.stringify(schema);
}

/**
 * Convert multiple schemas to JSON-LD strings
 */
export function schemasToJsonLd(schemas: any[]): string[] {
  return schemas.map(schema => JSON.stringify(schema));
}

/**
 * Combine multiple schemas into one graph
 * Useful for related schemas that should be grouped
 */
export function combineSchemas(schemas: any[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
}

/**
 * Validate schema has required properties
 */
export function validateRequiredProps(schema: any, requiredProps: string[]): boolean {
  return requiredProps.every(prop => schema[prop] !== undefined);
}

/**
 * Clean schema by removing undefined/null values
 */
export function cleanSchema(schema: any): any {
  if (Array.isArray(schema)) {
    return schema.map(cleanSchema).filter(item => item !== undefined && item !== null);
  }
  
  if (typeof schema === 'object' && schema !== null) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(schema)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = cleanSchema(value);
      }
    }
    return cleaned;
  }
  
  return schema;
}

/**
 * Format ISO 8601 duration for HowTo schemas
 * @param minutes - Duration in minutes
 * @returns ISO 8601 duration string (e.g., "PT5M")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `PT${minutes}M`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `PT${hours}H${mins}M` : `PT${hours}H`;
}

/**
 * Generate breadcrumb items from path
 * @param path - URL path (e.g., "/dashboard/settings")
 * @param baseUrl - Base URL (default: https://www.bondhu.tech)
 */
export function generateBreadcrumbs(path: string, baseUrl: string = 'https://www.bondhu.tech') {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'Home', url: baseUrl }
  ];
  
  let currentPath = '';
  segments.forEach(segment => {
    currentPath += `/${segment}`;
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    breadcrumbs.push({
      name,
      url: `${baseUrl}${currentPath}`
    });
  });
  
  return breadcrumbs;
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure URL uses HTTPS
 */
export function ensureHttps(url: string): string {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

/**
 * Get schema type from schema object
 */
export function getSchemaType(schema: any): string | null {
  return schema['@type'] || null;
}

/**
 * Merge schemas (useful for extending base schemas)
 */
export function mergeSchemas(base: any, override: any): any {
  return {
    ...base,
    ...override,
    // Preserve @context and @type from base if not overridden
    '@context': override['@context'] || base['@context'],
    '@type': override['@type'] || base['@type'],
  };
}
