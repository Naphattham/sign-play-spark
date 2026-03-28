/**
 * PNG → WebP Batch Converter
 * Usage: node scripts/convert-to-webp.mjs
 * Requires: npm install --save-dev sharp
 *
 * Converts every .png in src/asset/image/ (and subdirectories) to .webp at 80%
 * quality. Original .png files are kept so you can verify before deleting.
 */

import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "src", "asset", "image");

/** Recursively walk a directory and return all file paths */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function main() {

  const allFiles = await walk(ROOT);
  const pngFiles = allFiles.filter(
    (f) => extname(f).toLowerCase() === ".png"
  );

  if (pngFiles.length === 0) {
    return;
  }


  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const src of pngFiles) {
    const dest = src.replace(/\.png$/i, ".webp");
    const name = basename(src);

    try {
      const srcStat = await stat(src);

      await sharp(src)
        .webp({ quality: 80 })
        .toFile(dest);

      const destStat = await stat(dest);
      const savings = (
        ((srcStat.size - destStat.size) / srcStat.size) *
        100
      ).toFixed(1);
      const sign = savings >= 0 ? "-" : "+";

      converted++;
    } catch (err) {
      console.error(`  ❌  ${name}  →  FAILED: ${err.message}`);
      failed++;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
