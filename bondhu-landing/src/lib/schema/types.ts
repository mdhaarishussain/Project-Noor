/**
 * Schema.org Type Definitions for Bondhu
 * Comprehensive TypeScript types for all schema markup used in the application
 */

export interface SchemaBase {
  '@context': 'https://schema.org';
  '@type': string;
}

export interface SoftwareApplicationSchema extends SchemaBase {
  '@type': 'SoftwareApplication';
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: OfferSchema;
  aggregateRating?: AggregateRatingSchema;
  description: string;
  url: string;
  image?: string;
  screenshot?: string[];
  softwareVersion?: string;
  releaseNotes?: string;
  featureList?: string[];
  author?: OrganizationReference;
  provider?: OrganizationReference;
  availableOnDevice?: string;
  countriesSupported?: string[];
  inLanguage?: string[];
}

export interface OfferSchema {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  description?: string;
  availability?: string;
  validFrom?: string;
  priceValidUntil?: string;
}

export interface AggregateRatingSchema {
  '@type': 'AggregateRating';
  ratingValue: string;
  ratingCount: string;
  bestRating?: string;
  worstRating?: string;
}

export interface OrganizationSchema extends SchemaBase {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  foundingDate?: string;
  founders?: PersonSchema[];
  address?: PostalAddressSchema;
  contactPoint?: ContactPointSchema[];
  sameAs?: string[];
  email?: string;
  telephone?: string;
}

export interface OrganizationReference {
  '@type': 'Organization';
  name: string;
  url: string;
}

export interface PersonSchema {
  '@type': 'Person';
  name: string;
  jobTitle?: string;
}

export interface PostalAddressSchema {
  '@type': 'PostalAddress';
  addressCountry: string;
  addressRegion?: string;
  addressLocality?: string;
}

export interface ContactPointSchema {
  '@type': 'ContactPoint';
  contactType: string;
  email?: string;
  telephone?: string;
  availableLanguage?: string[];
  areaServed?: string;
}

export interface MedicalBusinessSchema extends SchemaBase {
  '@type': 'MedicalBusiness';
  name: string;
  description: string;
  medicalSpecialty: string[];
  availableService: MedicalServiceSchema[];
  url: string;
  priceRange?: string;
  areaServed?: string[];
}

export interface MedicalServiceSchema {
  '@type': 'MedicalTherapy' | 'MedicalTest' | 'MedicalProcedure';
  name: string;
  description?: string;
  relevantSpecialty?: string;
}

export interface ProductSchema extends SchemaBase {
  '@type': 'Product';
  name: string;
  description: string;
  brand?: BrandSchema;
  category?: string;
  offers?: OfferSchema;
  aggregateRating?: AggregateRatingSchema;
  image?: string;
  url?: string;
}

export interface BrandSchema {
  '@type': 'Brand';
  name: string;
}

export interface FAQPageSchema extends SchemaBase {
  '@type': 'FAQPage';
  mainEntity: QuestionSchema[];
}

export interface QuestionSchema {
  '@type': 'Question';
  name: string;
  acceptedAnswer: AnswerSchema;
}

export interface AnswerSchema {
  '@type': 'Answer';
  text: string;
}

export interface HowToSchema extends SchemaBase {
  '@type': 'HowTo';
  name: string;
  description: string;
  totalTime?: string;
  step: HowToStepSchema[];
  image?: string;
}

export interface HowToStepSchema {
  '@type': 'HowToStep';
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export interface WebPageSchema extends SchemaBase {
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  breadcrumb?: BreadcrumbListSchema;
  mainEntity?: any;
  isPartOf?: WebSiteSchema;
}

export interface WebSiteSchema extends SchemaBase {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: SearchActionSchema;
}

export interface SearchActionSchema {
  '@type': 'SearchAction';
  target: string;
  'query-input': string;
}

export interface BreadcrumbListSchema extends SchemaBase {
  '@type': 'BreadcrumbList';
  itemListElement: ListItemSchema[];
}

export interface ListItemSchema {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}
