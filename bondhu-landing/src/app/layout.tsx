import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getGlobalSchemas } from "@/lib/schema";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bondhu.tech'),
  title: {
    default: "Bondhu - AI Mental Health Companion for Gen Z India",
    template: "%s | Bondhu",
  },
  description:
    "AI companion that adapts to your personality through music, gaming, and content analysis. Get proactive mental health support tailored to Gen Z in India. 24/7 availability, OCEAN Big 5 personality assessment, end-to-end encrypted conversations.",
  keywords: [
    "AI mental health companion",
    "personality-based AI chatbot",
    "Gen Z mental health app",
    "AI therapy companion India",
    "adaptive mental health support",
    "personality assessment AI",
    "OCEAN Big 5 personality test",
    "mental wellness app",
    "AI mental health support",
    "Indian mental health app",
    "Gen Z therapy",
    "mental health chatbot",
    "personality AI",
    "proactive mental health",
    "culturally aware therapy",
  ],
  authors: [{ name: "Bondhu Team", url: "https://www.bondhu.tech/team" }],
  creator: "Bondhu",
  publisher: "Bondhu",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://www.bondhu.tech",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.bondhu.tech",
    siteName: "Bondhu",
    title: "Bondhu - AI Mental Health Companion | Personality-Based Support",
    description:
      "Meet your digital বন্ধু - an AI that learns your personality and grows with you. Get personalized mental health support through music, gaming, and content analysis. 24/7 support for Gen Z.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bondhu - AI Mental Health Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@bondhu.tech",
    creator: "@bondhu.tech",
    title: "Bondhu - Your Personality-Based AI Mental Health Companion",
    description:
      "AI companion that adapts to who you are. Mental health support through personality analysis, music, gaming, and content preferences.",
    images: ["/twitter-image.png"],
  },
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification code
  },
  category: "Health & Wellness",
  applicationName: "Bondhu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const globalSchemas = getGlobalSchemas();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Global Schema Markup */}
        {globalSchemas.map((schema, index) => (
          <script
            key={`schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
