/**
 * @file layout.tsx
 * @description Root layout file for the Next.js application.
 * 
 * Use Cases:
 * - Provides the base HTML document structure.
 * - Imports global styles.
 * - Sets global metadata for the Sese app.
 */

import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sese - AI Study Companion',
  description: 'A real-time multimodal AI study companion.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
