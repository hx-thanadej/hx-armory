import type { CatalogItem, Kind } from '../catalog/types';
import type { KindFilter } from '../state';

const kinds: readonly KindFilter[] = ['all', 'terraform', 'helm', 'manifest', 'command'];
const kindLabel: Record<KindFilter, string> = {
  all: 'All',
  terraform: 'Terraform',
  helm: 'Helm',
  manifest: 'YAML',
  command: 'Commands',
};

type Props = {
  items: readonly CatalogItem[];
  selectedIds: ReadonlySet<string>;
  query: string;
  kind: KindFilter;
  onQuery: (query: string) => void;
  onKind: (kind: KindFilter) => void;
  onToggle: (item: CatalogItem) => void;
};

const matches = (item: CatalogItem, query: string, kind: KindFilter) => {
  if (kind !== 'all' && item.kind !== kind) return false;
  const needle = query.trim().toLowerCase();
  return !needle || [item.name, item.description, item.id, item.category].some((text) => text.toLowerCase().includes(needle));
};

export function CatalogList({ items, selectedIds, query, kind, onQuery, onKind, onToggle }: Props) {
  const visible = items.filter((item) => matches(item, query, kind));
  const groups = new Map<string, CatalogItem[]>();
  for (const item of visible) groups.set(item.category, [...(groups.get(item.category) ?? []), item]);

  return (
    <nav className="catalog" aria-label="Catalog">
      <input
        type="search"
        className="search"
        placeholder="Search the catalog"
        aria-label="Search the catalog"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      <div className="chips" role="group" aria-label="Filter by kind">
        {kinds.map((value) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={kind === value}
            onClick={() => onKind(value)}
          >
            {kindLabel[value]}
          </button>
        ))}
      </div>
      {visible.length === 0 && <p className="hint">Nothing matches.</p>}
      {[...groups].map(([category, entries]) => (
        <fieldset key={category} className="group">
          <legend>{category}</legend>
          {entries.map((item) => (
            <label key={item.id} className="row">
              <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => onToggle(item)} />
              <span className="row-text">
                <span className="row-title">
                  {item.name} <span className={`badge badge-${item.kind satisfies Kind}`}>{item.kind}</span>
                </span>
                <span className="hint">{item.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ))}
    </nav>
  );
}
