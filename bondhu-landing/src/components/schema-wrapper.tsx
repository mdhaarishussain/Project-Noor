/**
 * Schema Wrapper Component
 * Reusable component for adding schema markup to any page
 */

interface SchemaWrapperProps {
  schemas: any[];
  children: React.ReactNode;
}

export function SchemaWrapper({ schemas, children }: SchemaWrapperProps) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {children}
    </>
  );
}
