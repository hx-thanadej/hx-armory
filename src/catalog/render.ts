import { contextParams } from './context';
import { buildScript } from './script';
import { renderTemplate } from './template';
import type { Bundle, CatalogItem, Context, OutFile, Selection, Values } from './types';
import { defaultValues, validateValues, type ValidationError } from './validate';

export type RenderResult =
  | { ok: true; bundle: Bundle }
  | { ok: false; errors: readonly ValidationError[] };

const withTrailingNewline = (text: string) => (text.endsWith('\n') ? text : `${text}\n`);

function renderItem(item: CatalogItem, values: Values, ctx: Context) {
  const vars = { ...values, ...ctx, dir: item.id };
  const files: OutFile[] = item.files.map((file) => ({
    path: `${item.id}/${file.path}`,
    language: file.language,
    content: withTrailingNewline(renderTemplate(file.template, vars, item.id)),
  }));
  const commands = item.commands.map((command) => renderTemplate(command, vars, item.id));
  return { files, step: { itemId: item.id, title: item.name, commands } };
}

// Bad user input comes back as errors. A TemplateError still throws because it means the catalog is wrong.
export function render(
  selections: readonly Selection[],
  ctx: Context,
  items: readonly CatalogItem[],
): RenderResult {
  const errors = validateValues(contextParams, ctx, null);
  const chosen = new Map(selections.map((selection) => [selection.itemId, selection.values]));
  const known = new Set(items.map((item) => item.id));
  for (const id of chosen.keys()) {
    if (!known.has(id)) errors.push({ itemId: id, key: null, message: `Unknown catalog item "${id}"` });
  }

  const resolved = items
    .filter((item) => chosen.has(item.id))
    .map((item) => ({ item, values: { ...defaultValues(item.params), ...chosen.get(item.id) } }));
  for (const { item, values } of resolved) errors.push(...validateValues(item.params, values, item.id));
  if (errors.length > 0) return { ok: false, errors };

  const rendered = resolved.map(({ item, values }) => renderItem(item, values, ctx));
  const files = rendered.flatMap((entry) => entry.files);
  const steps = rendered.map((entry) => entry.step).filter((step) => step.commands.length > 0);
  return { ok: true, bundle: { files, steps, script: buildScript(files, steps) } };
}
