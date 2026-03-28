/**
 * PNG → WebP reference updater for React source files
 * Usage: node scripts/update-png-refs.mjs [--dry-run]
 *
 * Finds every TypeScript/TSX file under src/ and replaces:
 *   - import … from "…/image/…something.png"  →  .webp
 *   - import … from "@/asset/image/…something.png"  →  .webp
 *   - JSX src="…something.png"  →  .webp   (for public-folder refs)
 *
 * NOTE: This script only touches .png references that point to
 * the src/asset/image tree (via @/ alias or relative path).
 * It deliberately SKIPS /public references like /LOGO_SignMate.png.
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(__dirname, "..", "src");
const DRY_RUN = process.argv.includes("--dry-run");

if (DRY_RUN) console.log("🔎  DRY-RUN mode — no files will be written.\n");

/** Recursively collect .ts / .tsx files */
async function walkSrc(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walkSrc(full)));
    } else if ([".ts", ".tsx"].includes(extname(e.name))) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Replace .png → .webp in:
 *   import X from "@/asset/image/...something.png"
 *   import X from "../asset/image/...something.png"   (relative variants)
 *   import X from "./asset/image/...something.png"
 *
 * The regex intentionally matches only paths that contain /asset/image/
 * so it never touches public-folder references like "/LOGO_SignMate.png".
 */
function transformContent(content) {
  // Matches import statements whose path contains /asset/image/ and ends with .png
  // Handles both @/ alias and relative paths (../ or ./)
  const importRegex =
    /(from\s+["'])([^"']*\/asset\/image\/[^"']*?)\.png(["'])/g;

  // Also catch dynamic imports / require() calls
  const requireRegex =
    /(import\(["']|require\(["'])([^"']*\/asset\/image\/[^"']*?)\.png(["'])/g;

  let updated = content
    .replace(importRegex, "$1$2.webp$3")
    .replace(requireRegex, "$1$2.webp$3");

  return updated;
}

async function main() {
  const files = await walkSrc(SRC_ROOT);
  console.log(`🔍  Scanning ${files.length} TypeScript/TSX files in src/\n`);

  let changed = 0;
  let unchanged = 0;

  for (const file of files) {
    const original = await readFile(file, "utf8");
    const updated = transformContent(original);

    if (updated !== original) {
      // Show a simple diff summary
      const origLines = original.split("\n");
      const updLines = updated.split("\n");
      const changedLines = [];
      for (let i = 0; i < origLines.length; i++) {
        if (origLines[i] !== updLines[i]) {
          changedLines.push(
            `    L${i + 1}: "${origLines[i].trim()}" → "${updLines[i].trim()}"`
          );
        }
      }

      const rel = file.replace(SRC_ROOT + "/", "src/");
      console.log(`  ✏️   ${rel}  (${changedLines.length} change(s))`);
      changedLines.forEach((l) => console.log(l));

      if (!DRY_RUN) {
        await writeFile(file, updated, "utf8");
      }
      changed++;
    } else {
      unchanged++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Files updated  : ${DRY_RUN ? `${changed} (dry-run, not written)` : changed}
  Files unchanged: ${unchanged}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${DRY_RUN ? "\n⚠️  Re-run without --dry-run to apply changes." : "\n✅  All done! Commit the changes and delete the old .png files."}
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
