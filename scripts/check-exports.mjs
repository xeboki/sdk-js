import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

/*
 * Every path this package promises must exist, and both entry points must
 * actually load.
 *
 * `main` pointed at `./dist/cjs/index.cjs` for as long as the package has
 * existed, and `npm run build` failed on its second command, so that
 * directory was never written. Nothing noticed, because the only consumer in
 * the repo imports the ESM build — a `require()` from anywhere else would
 * have thrown ENOENT on a file that was never going to be there.
 *
 * Derived from `package.json` rather than listed here: a path added to
 * `exports` next year is exactly the one a hand-written check would miss.
 */
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

const promised = new Set();
const collect = (value) => {
  if (typeof value === 'string' && value.startsWith('./')) promised.add(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
};
for (const field of ['main', 'module', 'types', 'exports']) collect(pkg[field]);

const missing = [...promised].filter(
  (p) => !existsSync(fileURLToPath(new URL(p, root))),
);
if (missing.length) {
  console.error(
    `package.json promises paths the build does not produce:\n  ${missing.join('\n  ')}`,
  );
  process.exit(1);
}

// Promised is not the same as loadable: a CommonJS build inside a
// `"type": "module"` package reads as ESM and throws on its own `require`.
const require = createRequire(import.meta.url);
const cjs = require(fileURLToPath(new URL(pkg.main, root)));
const esm = await import(new URL(pkg.module, root).href);
for (const [kind, mod] of [['require', cjs], ['import', esm]]) {
  if (typeof mod.XebokiClient !== 'function') {
    console.error(`${kind} resolved but did not export XebokiClient`);
    process.exit(1);
  }
}

console.log(`entry points ok (${promised.size} paths, require + import)`);
