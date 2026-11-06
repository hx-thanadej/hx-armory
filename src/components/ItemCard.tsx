import type { CatalogItem, ParamValue, Values } from '../catalog/types';
import type { ValidationError } from '../catalog/validate';
import { KindBadge } from './KindBadge';
import { ParamField } from './ParamField';

type Props = {
  item: CatalogItem;
  values: Values;
  errors: readonly ValidationError[];
  onChange: (key: string, value: ParamValue) => void;
  onRemove: () => void;
};

export function ItemCard({ item, values, errors, onChange, onRemove }: Props) {
  const titleId = `item-${item.id}`;
  return (
    <section className={`card kind-edge-${item.kind}`} aria-labelledby={titleId}>
      <header className="card-head">
        <h3 id={titleId}>{item.name}</h3>
        <KindBadge kind={item.kind} />
        <button type="button" className="link-button" onClick={onRemove}>
          Remove<span className="visually-hidden"> {item.name}</span>
        </button>
      </header>
      {errors.filter((error) => error.key === null).map((error) => (
        <p key={error.message} className="field-error">
          {error.message}
        </p>
      ))}
      {item.params.length === 0 ? (
        <p className="card-note">Nothing to fill in. It uses the shared settings only.</p>
      ) : (
        <div className="fields">
          {item.params.map((param) => (
            <ParamField
              key={param.key}
              param={param}
              value={values[param.key]}
              error={errors.find((error) => error.key === param.key)?.message}
              onChange={(value) => onChange(param.key, value)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
