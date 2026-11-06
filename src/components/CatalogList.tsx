import type { CatalogItem, Kind } from '../catalog/types';
import { outputSummary, pickedSummary, viewCatalog } from '../catalogView';
import type { KindFilter } from '../state';
import { requiredTools } from '../tools';
import { Icon } from './Icon';
import { KindBadge, kindLabel } from './KindBadge';

const filters: readonly KindFilter[] = ['all', 'terraform', 'helm', 'manifest', 'command'];
const filterLabel = (kind: KindFilter) => (kind === 'all' ? 'All' : kindLabel[kind satisfies Kind]);

type Props = {
  items: readonly CatalogItem[];
  selectedIds: ReadonlySet<string>;
  query: string;
  kind: KindFilter;
  onQuery: (query: string) => void;
  onKind: (kind: KindFilter) => void;
  onToggle: (item: CatalogItem) => void;
};

export function CatalogList({ items, selectedIds, query, kind, onQuery, onKind, onToggle }: Props) {
  const { groups, counts } = viewCatalog(items, query, kind);

  return (
    <div className="catalog">
      <div className="filters">
        <label className="search">
          <Icon name="search" />
          <span className="visually-hidden">Search the catalog</span>
          <input type="search" placeholder="Search by name or description" value={query} onChange={(e) => onQuery(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filter by kind">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip chip-${value}`}
              aria-pressed={kind === value}
              onClick={() => onKind(value)}
            >
              {filterLabel(value)}
              <span className="chip-count">{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && <p className="empty-note">Nothing matches. Try another word or the All filter.</p>}

      {groups.map((group) => {
        const picked = pickedSummary(group, selectedIds);
        return (
          <fieldset key={group.category} className="group">
            <legend>
              {group.category}
              {picked && <span className="group-picked">{picked}</span>}
            </legend>
            {group.items.map((item) => (
              <label key={item.id} className={`row kind-edge-${item.kind}`}>
                <input type="checkbox" className="row-check" checked={selectedIds.has(item.id)} onChange={() => onToggle(item)} />
                <span className="row-body">
                  <span className="row-title">
                    <span className="row-name">{item.name}</span>
                    <KindBadge kind={item.kind} />
                  </span>
                  <span className="row-description">{item.description}</span>
                  <span className="row-tools">
                    Needs {requiredTools(item).join(', ') || 'nothing extra'}. {outputSummary(item)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}
