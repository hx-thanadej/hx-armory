import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { catalog } from '../src/catalog';
import { defaultContext } from '../src/catalog/context';
import { render } from '../src/catalog/render';
import { defaultValues } from '../src/catalog/validate';
import type { Selection } from '../src/catalog/types';

// Writes every catalog item rendered twice, once with defaults and once with every
// boolean flipped, so external tools (terraform, helm, kubectl) can check both branches.
const out = process.argv[2];
if (!out) {
  console.error('usage: pnpm emit <output dir>');
  process.exit(1);
}

const flipBooleans = (values: Selection['values']): Selection['values'] =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'boolean' ? !value : value]));

for (const variant of ['defaults', 'flipped'] as const) {
  const selections = catalog.map((item) => {
    const values = defaultValues(item.params);
    return { itemId: item.id, values: variant === 'flipped' ? flipBooleans(values) : values };
  });
  const result = render(selections, defaultContext, catalog);
  if (!result.ok) {
    console.error(JSON.stringify(result.errors, null, 2));
    process.exit(1);
  }
  const files = [...result.bundle.files.map((f) => ({ path: f.path, content: f.content })), { path: 'deploy.sh', content: result.bundle.script }];
  for (const file of files) {
    const target = join(out, variant, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.content);
  }
  console.log(`${variant}: ${files.length} files in ${join(out, variant)}`);
}
