import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Balos Dashboard — Real Estate Operations',
  description: 'AI-driven lead conversion and operations dashboard for Dubai real estate agencies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Figtree:wght@300..900&family=Noto+Sans+Arabic:wght@300..800&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-seaglass text-ink selection:bg-creek-light selection:text-creek">
        {children}
      </body>
    </html>
  );
}
