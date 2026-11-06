import { useState } from 'react';
import type { CatalogItem } from '../catalog/types';
import type { KindFilter } from '../state';
import { CatalogList } from './CatalogList';
import { Icon } from './Icon';
import { StepFooter } from './StepFooter';

type Props = {
  items: readonly CatalogItem[];
  selectedItems: readonly CatalogItem[];
  query: string;
  kind: KindFilter;
  onQuery: (query: string) => void;
  onKind: (kind: KindFilter) => void;
  onToggle: (item: CatalogItem) => void;
  onExample: () => void;
  onContinue: () => void;
};

export function PickStep({ items, selectedItems, onExample, onContinue, ...catalog }: Props) {
  const selectedIds = new Set(selectedItems.map((item) => item.id));
  // Decided once per visit so ticking the first row does not pull the list up under the pointer.
  const [welcome] = useState(selectedItems.length === 0);
  return (
    <>
      <section className="step-body" aria-labelledby="step-heading">
        <header className="step-intro">
          <h2 id="step-heading" tabIndex={-1}>
            Pick what you need
          </h2>
          <p className="lede">Tick the infrastructure pieces for your service. You can change this later.</p>
        </header>

        {welcome && (
          <div className="welcome">
            <ol className="welcome-steps">
              <li>Tick the pieces you need: Terraform, Helm charts, Kubernetes YAML or kubectl commands.</li>
              <li>Fill in a few names. Defaults are safe to start with.</li>
              <li>Copy the files and commands and run them yourself. Armory never applies anything.</li>
            </ol>
            <button type="button" className="btn btn-secondary" onClick={onExample}>
              Try an example
            </button>
          </div>
        )}

        <CatalogList items={items} selectedIds={selectedIds} {...catalog} />
      </section>

      <StepFooter>
        <div className="selection" aria-live="polite">
          <span className="selection-count">
            {selectedItems.length === 0 ? 'Nothing selected yet' : `${selectedItems.length} selected`}
          </span>
          <ul className="selection-chips">
            {selectedItems.map((item) => (
              <li key={item.id}>
                <button type="button" className="tag" onClick={() => catalog.onToggle(item)}>
                  {item.name}
                  <Icon name="close" size={14} />
                  <span className="visually-hidden">Remove {item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="btn btn-primary" disabled={selectedItems.length === 0} onClick={onContinue}>
          Continue
          <Icon name="next" />
        </button>
      </StepFooter>
    </>
  );
}
