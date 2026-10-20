import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Employee Management System (EMS v3.0) — James Maqui Pantas',
  description: 'A modern web-based Employee Management System featuring Employee and Department Manager modules.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              input::-ms-reveal,
              input::-ms-clear {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
              }
              input::-webkit-credentials-auto-fill-button,
              input::-webkit-contacts-auto-fill-button {
                visibility: hidden !important;
                display: none !important;
                pointer-events: none !important;
                width: 0 !important;
                height: 0 !important;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased font-sans selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
