import { contextParams, defaultContext } from './catalog/context';
import type { CatalogItem, Context, Param, ParamValue, Values } from './catalog/types';
import type { Shared } from './state';

// Hash layout: c.<key>=<value> for the context, i=<id> per selected item, <id>.<key>=<value> per param.
// Everything in the hash is untrusted. It is coerced to each param's type and then validated by render.

export function encodeHash({ ctx, selected }: Shared, items: readonly CatalogItem[]): string {
  const params = new URLSearchParams();
  for (const param of contextParams) params.set(`c.${param.key}`, ctx[param.key as keyof Context]);
  for (const item of items) {
    const values = selected[item.id];
    if (!values) continue;
    params.append('i', item.id);
    for (const param of item.params) {
      const value = values[param.key];
      if (value !== undefined) params.set(`${item.id}.${param.key}`, String(value));
    }
  }
  return params.toString();
}

function coerce(param: Param, raw: string | null): ParamValue {
  if (raw === null) return param.default;
  switch (param.type) {
    case 'number': {
      const parsed = raw.trim() === '' ? Number.NaN : Number(raw);
      return Number.isFinite(parsed) ? parsed : param.default;
    }
    case 'boolean':
      return raw === 'true' ? true : raw === 'false' ? false : param.default;
    default:
      return raw;
  }
}

export function parseHash(hash: string, items: readonly CatalogItem[]): Shared {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const ctx = { ...defaultContext };
  for (const param of contextParams) {
    const raw = params.get(`c.${param.key}`);
    if (raw !== null) ctx[param.key as keyof Context] = raw;
  }

  const wanted = new Set(params.getAll('i'));
  const selected: Record<string, Values> = {};
  for (const item of items) {
    if (!wanted.has(item.id)) continue;
    selected[item.id] = Object.fromEntries(
      item.params.map((param) => [param.key, coerce(param, params.get(`${item.id}.${param.key}`))]),
    );
  }
  return { ctx, selected };
}
