import { contextParams } from '../catalog/context';
import type { Context } from '../catalog/types';
import type { ValidationError } from '../catalog/validate';
import { ParamField } from './ParamField';

type Props = {
  ctx: Context;
  errors: readonly ValidationError[];
  onChange: (key: keyof Context, value: string) => void;
};

export function ContextForm({ ctx, errors, onChange }: Props) {
  return (
    <section className="card card-shared" aria-labelledby="context-title">
      <header className="card-head">
        <h3 id="context-title">Shared settings</h3>
      </header>
      <p className="card-note">Every item below uses these names, so set them once here.</p>
      <div className="fields">
        {contextParams.map((param) => (
          <ParamField
            key={param.key}
            param={param}
            value={ctx[param.key as keyof Context]}
            error={errors.find((error) => error.itemId === null && error.key === param.key)?.message}
            onChange={(value) => onChange(param.key as keyof Context, String(value))}
          />
        ))}
      </div>
    </section>
  );
}
