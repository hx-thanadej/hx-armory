import type { CatalogItem } from './catalog/types';
import type { KindFilter } from './state';

export type CatalogGroup = { category: string; items: readonly CatalogItem[] };

export type CatalogView = {
  groups: readonly CatalogGroup[];
  counts: Readonly<Record<KindFilter, number>>;
};

const matchesQuery = (item: CatalogItem, query: string) => {
  const needle = query.trim().toLowerCase();
  return !needle || [item.name, item.description, item.id, item.category].some((text) => text.toLowerCase().includes(needle));
};

// Counts follow the search but ignore the kind filter, so each chip says what picking it would show.
export function viewCatalog(items: readonly CatalogItem[], query: string, kind: KindFilter): CatalogView {
  const found = items.filter((item) => matchesQuery(item, query));
  const counts = { all: found.length, terraform: 0, helm: 0, manifest: 0, command: 0 };
  for (const item of found) counts[item.kind] += 1;

  const groups = new Map<string, CatalogItem[]>();
  for (const item of found) {
    if (kind !== 'all' && item.kind !== kind) continue;
    groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
  }
  return { groups: [...groups].map(([category, entries]) => ({ category, items: entries })), counts };
}

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const outputSummary = (item: CatalogItem) =>
  `${plural(item.files.length, 'file')}, ${plural(item.commands.length, 'command')}`;

// Null when nothing in the group is picked, so the heading stays quiet until it has something to say.
export function pickedSummary(group: CatalogGroup, selectedIds: ReadonlySet<string>): string | null {
  const picked = group.items.filter((item) => selectedIds.has(item.id)).length;
  return picked > 0 ? `${picked} of ${group.items.length} picked` : null;
}
