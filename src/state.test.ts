import { describe, expect, it } from 'vitest';
import { catalog } from './catalog';
import { defaultValues } from './catalog/validate';
import { encodeHash, parseHash } from './hash';
import { initialState, reducer, type State } from './state';

const item = (id: string) => {
  const found = catalog.find((entry) => entry.id === id);
  if (!found) throw new Error(`no item ${id}`);
  return found;
};
const s3 = item('aws-s3-bucket');
const redis = item('helm-redis');

describe('reducer', () => {
  it('selects an item with its defaults and unselects it on the second toggle', () => {
    const on = reducer(initialState, { type: 'toggle', item: s3 });
    expect(on.selected).toEqual({ 'aws-s3-bucket': defaultValues(s3.params) });
    expect(reducer(on, { type: 'toggle', item: s3 }).selected).toEqual({});
  });

  it('edits one param without touching the others', () => {
    const on = reducer(initialState, { type: 'toggle', item: s3 });
    const next = reducer(on, { type: 'setParam', itemId: s3.id, key: 'suffix', value: 'logs' });
    expect(next.selected[s3.id]).toEqual({ ...defaultValues(s3.params), suffix: 'logs' });
  });

  it('ignores edits to an item that is not selected', () => {
    expect(reducer(initialState, { type: 'setParam', itemId: s3.id, key: 'suffix', value: 'x' })).toBe(initialState);
  });

  it('updates a context field', () => {
    expect(reducer(initialState, { type: 'setContext', key: 'env', value: 'prod' }).ctx.env).toBe('prod');
  });

  it('keeps filters when a link is loaded', () => {
    const filtered = reducer(initialState, { type: 'setQuery', query: 'redis' });
    const loaded = reducer(filtered, { type: 'load', shared: { ctx: initialState.ctx, selected: {} } });
    expect(loaded.query).toBe('redis');
  });
});

describe('URL hash', () => {
  const pick = (): State => {
    let state = reducer(initialState, { type: 'toggle', item: redis });
    state = reducer(state, { type: 'toggle', item: s3 });
    state = reducer(state, { type: 'setParam', itemId: s3.id, key: 'suffix', value: 'logs' });
    state = reducer(state, { type: 'setParam', itemId: redis.id, key: 'replicas', value: 4 });
    state = reducer(state, { type: 'setParam', itemId: redis.id, key: 'metrics', value: true });
    return reducer(state, { type: 'setContext', key: 'project', value: 'shop' });
  };

  it('restores the same selection, values and context after a reload', () => {
    const before = pick();
    const restored = parseHash(`#${encodeHash(before, catalog)}`, catalog);
    expect(restored.ctx).toEqual(before.ctx);
    expect(restored.selected).toEqual(before.selected);
  });

  it('gives the same link whatever order items were ticked in', () => {
    const a = reducer(reducer(initialState, { type: 'toggle', item: s3 }), { type: 'toggle', item: redis });
    const b = reducer(reducer(initialState, { type: 'toggle', item: redis }), { type: 'toggle', item: s3 });
    expect(encodeHash(a, catalog)).toBe(encodeHash(b, catalog));
  });

  it('starts empty and with default context when there is no hash', () => {
    expect(parseHash('', catalog)).toEqual({ ctx: initialState.ctx, selected: {} });
  });

  it('drops unknown item ids', () => {
    expect(parseHash('#i=not-a-real-item&i=aws-s3-bucket', catalog).selected).toEqual({
      'aws-s3-bucket': defaultValues(s3.params),
    });
  });

  it('falls back to defaults for values of the wrong type instead of trusting them', () => {
    const hash = '#i=helm-redis&helm-redis.replicas=lots&helm-redis.metrics=maybe&helm-redis.auth=false';
    const values = parseHash(hash, catalog).selected['helm-redis'];
    expect(values).toMatchObject({ replicas: 2, metrics: false, auth: false });
  });

  it('keeps text that fails validation so the form can show the error', () => {
    const values = parseHash('#i=aws-s3-bucket&aws-s3-bucket.suffix=Bad%20Value', catalog).selected['aws-s3-bucket'];
    expect(values?.suffix).toBe('Bad Value');
  });
});
