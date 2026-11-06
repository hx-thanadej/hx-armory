import type { CatalogItem, Context, ParamValue, Values } from '../catalog/types';
import type { ValidationError } from '../catalog/validate';
import { ContextForm } from './ContextForm';
import { Icon } from './Icon';
import { ItemCard } from './ItemCard';
import { StepFooter } from './StepFooter';

type Props = {
  ctx: Context;
  selectedItems: readonly CatalogItem[];
  selected: Readonly<Record<string, Values>>;
  errors: readonly ValidationError[];
  onContext: (key: keyof Context, value: string) => void;
  onParam: (itemId: string, key: string, value: ParamValue) => void;
  onRemove: (item: CatalogItem) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function ConfigureStep({ ctx, selectedItems, selected, errors, onContext, onParam, onRemove, onBack, onContinue }: Props) {
  const blocked = errors.length > 0;
  return (
    <>
      <section className="step-body" aria-labelledby="step-heading">
        <header className="step-intro">
          <h2 id="step-heading" tabIndex={-1}>
            Configure
          </h2>
          <p className="lede">The defaults work. Change only what you need.</p>
        </header>
        <ContextForm ctx={ctx} errors={errors} onChange={onContext} />
        {selectedItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            values={selected[item.id] ?? {}}
            errors={errors.filter((error) => error.itemId === item.id)}
            onChange={(key, value) => onParam(item.id, key, value)}
            onRemove={() => onRemove(item)}
          />
        ))}
      </section>

      <StepFooter>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <Icon name="back" />
          Back
        </button>
        <span className="footer-status" aria-live="polite">
          {blocked && (
            <>
              <Icon name="alert" size={16} />
              Fix {errors.length} {errors.length === 1 ? 'field' : 'fields'} to continue
            </>
          )}
        </span>
        <button type="button" className="btn btn-primary" disabled={blocked} onClick={onContinue}>
          Continue
          <Icon name="next" />
        </button>
      </StepFooter>
    </>
  );
}
