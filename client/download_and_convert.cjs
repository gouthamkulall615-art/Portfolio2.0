const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const icons = [
  {
    name: 'react.webp',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    bg: '#0f172a'
  },
  
  {
    name: 'javascript.webp',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    bg: '#0f172a'
  },
  {
    name: 'html.webp',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
    bg: '#0f172a'
  },
  {
    name: 'css.webp',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
    bg: '#0f172a'
  },
  {
    name: 'nodejs.webp',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg',
    bg: '#0f172a'
  },
  {
    name: 'mongodb.webp',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg',
    bg: '#0f172a'
  },
  {
    name: 'git.webp',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg',
    bg: '#0f172a'
  },
  {
    name: 'vercel.webp',
    url: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg',
    bg: '#0f172a'
  }
];

async function processIcon(item) {
  try {
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const svgBuffer = Buffer.from(await res.arrayBuffer());

    // Render SVG into 300x300 PNG with sharp
    const iconPng = await sharp(svgBuffer)
      .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Composite centered onto a 512x512 dark circular/rounded badge background
    const bgSvg = Buffer.from(`
      <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#0d1117" />
        <circle cx="256" cy="256" r="230" fill="#161b22" stroke="#30363d" stroke-width="8" />
      </svg>
    `);

    const destPath = path.join(outputDir, item.name);
    await sharp(bgSvg)
      .composite([{ input: iconPng, gravity: 'center' }])
      .webp({ quality: 90 })
      .toFile(destPath);

    console.log(`Saved: ${item.name}`);
  } catch (err) {
    console.error(`Error processing ${item.name}:`, err.message);
  }
}

async function main() {
  console.log('Downloading and converting icons to .webp...');
  for (const icon of icons) {
    await processIcon(icon);
  }
  console.log('Done generating all webp icons!');
}

main();
