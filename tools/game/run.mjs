import { mkdtempSync, readdirSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { verify } from './verify.mjs';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = mkdtempSync(join(tmpdir(), 'game-build-'));
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.ts') ? [path] : [];
  });
}
try {
  const args = ['--target', 'ES2020', '--module', 'commonjs', '--strict', '--noEmitOnError', '--outDir', output, ...files(join(root, 'src/game'))];
  let compiler;
  try { compiler = require.resolve('typescript/bin/tsc'); } catch { /* Allow a host project's tsc on PATH. */ }
  if (compiler) execFileSync(process.execPath, [compiler, ...args], { stdio: 'inherit' });
  else execFileSync('tsc', args, { stdio: 'inherit' });
  const load = path => require(join(output, path));
  const html = load('createGameHtml.js').createGameHtml();
  if (process.argv[2] === 'test') {
    verify(load, html, JSON.parse(readFileSync(join(root, 'tools/game/baseline.json'), 'utf8')));
  } else if (process.argv[2] === 'build') {
    // Default output does NOT overwrite the host application's Android assets.
    const destination = resolve(root, process.argv[3] || 'dist/game/game.html');
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, html);
    console.log('Generated:', destination);
  } else throw new Error('Usage: node tools/game/run.mjs test|build [output-file]');
} finally {
  rmSync(output, { recursive: true, force: true });
}
