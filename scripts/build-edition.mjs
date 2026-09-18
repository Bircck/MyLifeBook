import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const edition = process.argv[2];
if (!edition || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(edition) || process.argv.length !== 3) {
  console.error('Usage: npm run build:edition -- <edition-id>');
  process.exitCode = 1;
} else {
  const astroPackagePath = fileURLToPath(import.meta.resolve('astro/package.json'));
  const astroPackage = JSON.parse(readFileSync(astroPackagePath, 'utf8'));
  const astroCommand = path.resolve(path.dirname(astroPackagePath), astroPackage.bin.astro);
  // Separate output folders prevent a selected export from inheriting demo files.
  // Launch the JavaScript entry directly; no shell interpolation or platform-specific env syntax.
  const result = spawnSync(process.execPath, [astroCommand, 'build', '--outDir', `dist/editions/${edition}`], {
    cwd: projectRoot,
    env: { ...process.env, MLB_EDITION: edition },
    stdio: 'inherit',
  });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}
