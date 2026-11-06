import { useId } from 'react';
import type { Param, ParamValue } from '../catalog/types';
import { Icon } from './Icon';

type Props = {
  param: Param;
  value: ParamValue | undefined;
  error: string | undefined;
  onChange: (value: ParamValue) => void;
};

export function ParamField({ param, value, error, onChange }: Props) {
  const id = useId();
  const helpId = param.help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const common = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [errorId, helpId].filter(Boolean).join(' ') || undefined,
  };

  let control;
  switch (param.type) {
    case 'string':
      control = <input {...common} type="text" spellCheck={false} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
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
      {error && (
        <p className="field-error" id={errorId}>
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
      {param.help && (
        <p className="field-help" id={helpId}>
          {param.help}
        </p>
      )}
    </div>
  );
}
