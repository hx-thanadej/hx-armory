import { useId } from 'react';
import type { Param, ParamValue } from '../catalog/types';

type Props = {
  param: Param;
  value: ParamValue | undefined;
  error: string | undefined;
  onChange: (value: ParamValue) => void;
};

export function ParamField({ param, value, error, onChange }: Props) {
  const id = useId();
  const note = param.help ? `${id}-help` : undefined;
  const common = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': note };

  let control;
  switch (param.type) {
    case 'string':
      control = <input {...common} type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'number':
      control = (
        <input
          {...common}
          type="number"
          min={param.min}
          max={param.max}
          value={typeof value === 'number' && !Number.isNaN(value) ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))}
        />
      );
      break;
    case 'boolean':
      control = <input {...common} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />;
      break;
    case 'select':
      control = (
        <select {...common} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {param.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
      break;
  }

  return (
    <div className={`field field-${param.type}`}>
      <label htmlFor={id}>{param.label}</label>
      {control}
      {param.help && (
        <p className="hint" id={note}>
          {param.help}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
