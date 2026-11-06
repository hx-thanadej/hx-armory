import { reservedKeys } from './context';
import type { CatalogItem } from './types';

export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogError';
  }
}

// ids become directory names in deploy.sh and URL hash entries, so they stay boring.
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PARAM_KEY = /^[a-z][a-z0-9_]*$/;

export function defineCatalog(items: readonly CatalogItem[]): readonly CatalogItem[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (!ID.test(item.id)) throw new CatalogError(`Item id "${item.id}" must be lowercase words joined by hyphens`);
    if (ids.has(item.id)) throw new CatalogError(`Duplicate item id "${item.id}"`);
    ids.add(item.id);

    const keys = new Set<string>();
    for (const param of item.params) {
      if (!PARAM_KEY.test(param.key)) throw new CatalogError(`Param key "${param.key}" in "${item.id}" is not a valid template key`);
      if (reservedKeys.has(param.key)) {
        throw new CatalogError(`Param key "${param.key}" in "${item.id}" shadows a context key`);
      }
      if (keys.has(param.key)) throw new CatalogError(`Duplicate param key "${param.key}" in "${item.id}"`);
      keys.add(param.key);
      // A shared link can carry any text, so free-form strings never reach deploy.sh.
      if (param.type === 'string' && !param.pattern) {
        throw new CatalogError(`String param "${param.key}" in "${item.id}" needs a pattern`);
      }
    }
  }
  return items;
}
