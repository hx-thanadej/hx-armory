import type { CatalogItem, ParamValue, Values } from '../catalog/types';
import type { ValidationError } from '../catalog/validate';
import { ParamField } from './ParamField';

type Props = {
  item: CatalogItem;
  values: Values;
  errors: readonly ValidationError[];
  onChange: (key: string, value: ParamValue) => void;
  onRemove: () => void;
};

export function ItemCard({ item, values, errors, onChange, onRemove }: Props) {
  return (
    <section className="panel card" aria-label={item.name}>
      <header className="card-head">
        <h3>{item.name}</h3>
        <span className={`badge badge-${item.kind}`}>{item.kind}</span>
        <button type="button" className="btn btn-quiet" onClick={onRemove}>
          Remove
        </button>
      </header>
      {errors.filter((error) => error.key === null).map((error) => (
        <p key={error.message} className="error" role="alert">
          {error.message}
        </p>
      ))}
      {item.params.length === 0 ? (
        <p className="hint">No settings. Uses the shared settings only.</p>
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
