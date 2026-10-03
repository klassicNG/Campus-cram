import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML component for static web export.
 * Configures PWA metadata, Apple Mobile Web App tags, and responsive viewport.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>Campus-Cram — High-Yield Exam Intelligence</title>
        <meta
          name="description"
          content="High-yield Nigerian university exam prep: timed CBT, theory exam papers with handwritten AI grading, and cram sheets."
        />

        {/* PWA Manifest & Colors */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#001524" />

        {/* iOS / Safari Web App (PWA) Standalone Mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Campus-Cram" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />

        {/* Prevent horizontal overflow and enable smooth native app touch feel */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #001524;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
