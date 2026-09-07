#!/usr/bin/env node
/*
 * npm publishes from the repository root, but system.md and llms.txt are
 * authored in public/ because that is where they are served from. Rather than
 * keep two copies that can drift, they are copied to the root at pack time and
 * the root copies are gitignored.
 *
 * Run by `prepack`, so `npm publish` cannot forget it.
 */
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const file of ['system.md', 'llms.txt']) {
  await copyFile(join(root, 'public', file), join(root, file));
  console.log(`  sync     ${file} <- public/${file}`);
}
