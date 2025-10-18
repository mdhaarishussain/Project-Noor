/**
 * Schema Validation Script
 * Validates all schema markup for correctness and completeness
 * 
 * Usage: npx tsx scripts/validate-schemas.ts
 */

import {
  getBondhuAppSchema,
  getBondhuOrganizationSchema,
  getMentalHealthServiceSchema,
  getBondhuFAQSchema,
  getAllAgentSchemas,
  getMultiAgentSystemSchema,
  getAllHowToSchemas,
  getHomePageSchema,
  getChatPageSchema,
  getPersonalityInsightsPageSchema,
  getBondhuWebSiteSchema,
} from '../src/lib/schema';

interface ValidationResult {
  schemaName: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const results: ValidationResult[] = [];

function validateSchema(schemaName: string, schema: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required base properties
  if (!schema['@context']) {
    errors.push('Missing @context property');
  } else if (schema['@context'] !== 'https://schema.org') {
    errors.push(`Invalid @context: ${schema['@context']}`);
  }

  if (!schema['@type']) {
    errors.push('Missing @type property');
  }

  // Check for valid JSON
  try {
    JSON.stringify(schema);
  } catch (e) {
    errors.push(`Invalid JSON: ${e}`);
  }

  // Check for URLs
  const checkUrls = (obj: any, path: string = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        // Check for http:// (should be https://)
        if (value.includes('http://') && !value.includes('localhost')) {
          warnings.push(`Non-HTTPS URL at ${currentPath}: ${value}`);
        }
        
        // Check for placeholder URLs
        if (value.includes('example.com') || value.includes('your-')) {
          warnings.push(`Placeholder value at ${currentPath}: ${value}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        checkUrls(value, currentPath);
      }
    }
  };

  checkUrls(schema);

  // Type-specific validations
  switch (schema['@type']) {
    case 'SoftwareApplication':
      if (!schema.name) errors.push('Missing name');
      if (!schema.applicationCategory) errors.push('Missing applicationCategory');
      if (!schema.offers) errors.push('Missing offers');
      break;

    case 'Organization':
      if (!schema.name) errors.push('Missing name');
      if (!schema.url) errors.push('Missing url');
      break;

    case 'FAQPage':
      if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
        errors.push('Missing or invalid mainEntity array');
      } else if (schema.mainEntity.length === 0) {
        warnings.push('Empty FAQ list');
      }
      break;

    case 'HowTo':
      if (!schema.name) errors.push('Missing name');
      if (!schema.step || !Array.isArray(schema.step)) {
        errors.push('Missing or invalid step array');
      }
      break;

    case 'Product':
      if (!schema.name) errors.push('Missing name');
      if (!schema.description) errors.push('Missing description');
      break;

    case 'WebPage':
      if (!schema.name) errors.push('Missing name');
      if (!schema.url) errors.push('Missing url');
      break;
  }

  return {
    schemaName,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate all schemas
console.log('🔍 Validating Bondhu Schema Markup...\n');

// Global schemas
results.push(validateSchema('SoftwareApplication', getBondhuAppSchema()));
results.push(validateSchema('Organization', getBondhuOrganizationSchema()));
results.push(validateSchema('WebSite', getBondhuWebSiteSchema()));

// Medical/Health schemas
results.push(validateSchema('MedicalBusiness', getMentalHealthServiceSchema()));

// FAQ schema
results.push(validateSchema('FAQPage', getBondhuFAQSchema()));

// Agent schemas
const agents = getAllAgentSchemas();
agents.forEach((agent, index) => {
  results.push(validateSchema(`Product (Agent ${index + 1})`, agent));
});

results.push(validateSchema('Multi-Agent System', getMultiAgentSystemSchema()));

// HowTo schemas
const howTos = getAllHowToSchemas();
howTos.forEach((howTo, index) => {
  results.push(validateSchema(`HowTo ${index + 1}`, howTo));
});

// WebPage schemas
results.push(validateSchema('HomePage', getHomePageSchema()));
results.push(validateSchema('ChatPage', getChatPageSchema()));
results.push(validateSchema('PersonalityInsightsPage', getPersonalityInsightsPageSchema()));

// Print results
console.log('═══════════════════════════════════════════════════════\n');

let totalValid = 0;
let totalErrors = 0;
let totalWarnings = 0;

results.forEach((result) => {
  const status = result.valid ? '✅' : '❌';
  console.log(`${status} ${result.schemaName}`);

  if (result.errors.length > 0) {
    console.log('   Errors:');
    result.errors.forEach((error) => console.log(`   - ${error}`));
    totalErrors += result.errors.length;
  }

  if (result.warnings.length > 0) {
    console.log('   Warnings:');
    result.warnings.forEach((warning) => console.log(`   - ${warning}`));
    totalWarnings += result.warnings.length;
  }

  if (result.valid) totalValid++;
  console.log('');
});

console.log('═══════════════════════════════════════════════════════');
console.log(`\n📊 Summary:`);
console.log(`   Total Schemas: ${results.length}`);
console.log(`   Valid: ${totalValid}`);
console.log(`   Invalid: ${results.length - totalValid}`);
console.log(`   Total Errors: ${totalErrors}`);
console.log(`   Total Warnings: ${totalWarnings}`);

if (totalErrors === 0) {
  console.log('\n✨ All schemas are valid! Ready for deployment.\n');
} else {
  console.log('\n⚠️  Please fix errors before deployment.\n');
  process.exit(1);
}

// Export for testing
export { validateSchema, results };
