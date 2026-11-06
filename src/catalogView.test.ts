import { describe, expect, it } from 'vitest';
import { catalog } from './catalog';
import type { CatalogItem } from './catalog/types';
import { outputSummary, pickedSummary, plural, viewCatalog } from './catalogView';

const ids = (view: ReturnType<typeof viewCatalog>) => view.groups.flatMap((group) => group.items.map((item) => item.id));
const item = (files: number, commands: number) =>
  ({ files: Array(files).fill({}), commands: Array(commands).fill('x') }) as unknown as CatalogItem;

describe('viewCatalog', () => {
  it('shows every item grouped by category in catalog order when nothing is filtered', () => {
    const view = viewCatalog(catalog, '', 'all');
    expect(ids(view)).toEqual(catalog.map((entry) => entry.id));
    expect(view.groups.map((group) => group.category)).toEqual([...new Set(catalog.map((entry) => entry.category))]);
    expect(view.counts.all).toBe(catalog.length);
  });

  it('counts each kind from the search, whatever kind is chosen', () => {
    const helmOnly = viewCatalog(catalog, '', 'helm');
    expect(ids(helmOnly).every((id) => catalog.find((entry) => entry.id === id)?.kind === 'helm')).toBe(true);
    expect(helmOnly.counts).toEqual(viewCatalog(catalog, '', 'all').counts);
    expect(helmOnly.counts.helm).toBe(ids(helmOnly).length);
  });

  it('searches name, description, id and category without caring about case', () => {
    expect(ids(viewCatalog(catalog, '  KONG ', 'all'))).toEqual(['helm-kong']);
    expect(viewCatalog(catalog, 'kong', 'all').counts).toMatchObject({ all: 1, helm: 1, terraform: 0 });
    expect(viewCatalog(catalog, 'no such thing', 'all').groups).toEqual([]);
  });

  it('keeps counts for kinds the search has not emptied while the chosen kind has no match', () => {
    const view = viewCatalog(catalog, 'kong', 'terraform');
    expect(view.groups).toEqual([]);
    expect(view.counts.helm).toBe(1);
  });
});

describe('plural', () => {
  it('only drops the s for exactly one', () => {
    expect([0, 1, 2].map((count) => plural(count, 'file'))).toEqual(['0 files', '1 file', '2 files']);
  });
});

describe('outputSummary', () => {
  it('reads the files and commands arrays, keeping zero counts', () => {
    expect(outputSummary(item(1, 3))).toBe('1 file, 3 commands');
    expect(outputSummary(item(0, 1))).toBe('0 files, 1 command');
    expect(outputSummary(item(2, 0))).toBe('2 files, 0 commands');
  });
});

describe('pickedSummary', () => {
  const entries = catalog.slice(0, 3);
  const group = { category: 'Any', items: entries };

  it('says nothing while no item in the group is picked', () => {
    expect(pickedSummary(group, new Set())).toBeNull();
    expect(pickedSummary(group, new Set(['elsewhere']))).toBeNull();
  });

  it('counts picked items against the items the group shows', () => {
    expect(pickedSummary(group, new Set([entries[0]!.id]))).toBe('1 of 3 picked');
    expect(pickedSummary(group, new Set(entries.map((entry) => entry.id)))).toBe('3 of 3 picked');
  });
});
