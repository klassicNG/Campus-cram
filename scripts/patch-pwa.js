const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.log('No dist directory found.');
  process.exit(0);
}

const pwaHeadSnippet = `
    <title>Campus-Cram — High-Yield Exam Intelligence</title>
    <meta name="description" content="High-yield Nigerian university exam prep: timed CBT, theory exam papers with handwritten AI grading, and cram sheets." />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#001524" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Campus-Cram" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
`;

const files = fs.readdirSync(distDir);
files.forEach((file) => {
  if (file.endsWith('.html')) {
    const filePath = path.join(distDir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    if (!html.includes('rel="manifest"')) {
      html = html.replace('<head>', '<head>' + pwaHeadSnippet);
      fs.writeFileSync(filePath, html, 'utf8');
      console.log(`[PWA] Injected manifest & Apple PWA tags into dist/${file}`);
    }
  }
});
