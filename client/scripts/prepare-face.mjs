import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const cwd = process.cwd();
const isClient = fs.existsSync(path.join(cwd, 'public'));
const clientDir = isClient ? cwd : path.join(cwd, 'client');
const rootDir = isClient ? path.dirname(cwd) : cwd;

const faceSrcDir = path.join(rootDir, 'face-src');
const publicFaceDir = path.join(clientDir, 'public', 'face');

const KEYS = ['rest', 'closed', 'side', 'tensed', 'yawn'];

function matchKey(name) {
  const l = name.toLowerCase();
  if (l.includes('rest') || l.includes('neutral')) return 'rest';
  if (l.includes('closed')) return 'closed';
  if (l.includes('side')) return 'side';
  if (l.includes('tensed')) return 'tensed';
  if (l.includes('yawn')) return 'yawn';
  return null;
}

async function main() {
  console.log('=== Prepare Face Images ===');

  if (!fs.existsSync(faceSrcDir)) fs.mkdirSync(faceSrcDir, { recursive: true });
  if (!fs.existsSync(publicFaceDir)) fs.mkdirSync(publicFaceDir, { recursive: true });

  // 1. Move source PNGs from public/face into face-src
  const sourceFiles = {};

  if (fs.existsSync(publicFaceDir)) {
    for (const f of fs.readdirSync(publicFaceDir)) {
      if (!f.toLowerCase().endsWith('.png')) continue;
      const key = matchKey(f);
      if (key) {
        const src = path.join(publicFaceDir, f);
        const dest = path.join(faceSrcDir, f);
        console.log(`[Move] Moving ${f} -> face-src/`);
        fs.copyFileSync(src, dest);
        fs.unlinkSync(src);
        sourceFiles[key] = dest;
      }
    }
  }

  // Also check face-src
  for (const f of fs.readdirSync(faceSrcDir)) {
    if (!f.toLowerCase().endsWith('.png')) continue;
    const key = matchKey(f);
    if (key && !sourceFiles[key]) {
      sourceFiles[key] = path.join(faceSrcDir, f);
    }
  }

  console.log('[Detect] Found source files:');
  for (const k of KEYS) {
    console.log(`  - ${k}: ${sourceFiles[k] ? path.basename(sourceFiles[k]) : 'MISSING'}`);
  }

  const missing = KEYS.filter(k => !sourceFiles[k]);
  if (missing.length > 0) {
    console.error(`\n❌ ERROR: Missing source images for keys: ${missing.join(', ')}`);
    process.exit(1);
  }

  // 2. Check metadata
  const metaMap = {};
  for (const k of KEYS) {
    const m = await sharp(sourceFiles[k]).metadata();
    metaMap[k] = { width: m.width, height: m.height, file: path.basename(sourceFiles[k]) };
  }

  console.log('\n[Dimensions]:');
  for (const k of KEYS) {
    console.log(`  ${k} (${metaMap[k].file}): ${metaMap[k].width} x ${metaMap[k].height}`);
  }

  // Target canvas size (use the modal 2400x1792 standard)
  const targetW = 2400;
  const targetH = 1792;

  // 3. Normalize all images to uniform canvas (2400x1792) with head aligned if exports varied
  const normalizedBuffers = {};
  for (const k of KEYS) {
    const { width, height } = metaMap[k];
    const srcPath = sourceFiles[k];

    if (width === targetW && height === targetH) {
      normalizedBuffers[k] = await sharp(srcPath).toBuffer();
    } else {
      console.log(`[Normalize] Aligning canvas for ${k} (${width}x${height} -> ${targetW}x${targetH})`);
      // Pad or fit onto transparent target canvas
      normalizedBuffers[k] = await sharp(srcPath)
        .resize({
          width: targetW,
          height: targetH,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();
    }
  }

  // 4. Compute alpha bounding box of `rest`
  console.log('\n[Compute] Scanning alpha bounding box of "rest"...');
  const restRaw = await sharp(normalizedBuffers.rest).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = restRaw;
  const { width: rw, height: rh, channels } = info;

  let minX = rw, maxX = 0, minY = rh, maxY = 0;
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const a = data[(y * rw + x) * channels + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const bboxCenterX = (minX + maxX) / 2;
  console.log(`  Bbox bounds: x=[${minX}, ${maxX}], y=[${minY}, ${maxY}], CenterX=${bboxCenterX.toFixed(1)}`);

  // Crop square of side = image height, centred horizontally on bbox centre (clamped)
  const side = targetH;
  let left = Math.round(bboxCenterX - side / 2);
  left = Math.max(0, Math.min(targetW - side, left));
  const top = 0;

  console.log(`  Crop box: left=${left}, top=${top}, width=${side}, height=${side}`);

  // 5. Crop, resize to 1024x1024, write /public/face/<key>.webp
  const results = [];
  for (const k of KEYS) {
    const outPath = path.join(publicFaceDir, `${k}.webp`);
    await sharp(normalizedBuffers[k])
      .extract({ left, top, width: side, height: side })
      .resize(1024, 1024, { fit: 'fill' })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(outPath);

    const stat = fs.statSync(outPath);
    results.push({
      Key: k,
      File: `${k}.webp`,
      Size: `${(stat.size / 1024).toFixed(1)} KB`,
      Dimensions: '1024x1024'
    });
  }

  console.log('\n=== Output WebP Files in /public/face ===');
  console.table(results);
  console.log('✓ Success! Face preparation complete.');
}

main().catch(err => {
  console.error('Error preparing face:', err);
  process.exit(1);
});

