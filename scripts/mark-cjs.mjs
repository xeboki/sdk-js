import { mkdirSync, writeFileSync } from 'node:fs';

/*
 * Tell Node that `dist/cjs` is CommonJS.
 *
 * The package is `"type": "module"`, so a `.js` file anywhere inside it is
 * read as ESM — including the CommonJS build, which would then fail on its
 * own `require` calls. A `package.json` in that one directory overrides the
 * type for everything under it, which is the standard way to ship both from
 * one package without renaming every emitted file to `.cjs`.
 */
mkdirSync(new URL('../dist/cjs/', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../dist/cjs/package.json', import.meta.url),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
);
