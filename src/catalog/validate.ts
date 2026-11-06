import type { Param, ParamValue, Values } from './types';

// itemId is null for the shared context fields. key is null when the whole item is at fault.
export type ValidationError = { itemId: string | null; key: string | null; message: string };

export function defaultValues(params: readonly Param[]): Values {
  return Object.fromEntries(params.map((param) => [param.key, param.default]));
}

function problem(param: Param, value: ParamValue | undefined): string | null {
  switch (param.type) {
    case 'string': {
      if (typeof value !== 'string') return `${param.label} must be text`;
      if (value === '') return `${param.label} is required`;
      if (param.pattern && !new RegExp(`^(?:${param.pattern})$`).test(value)) {
        return `${param.label} has an invalid format, allowed: ${param.pattern}`;
      }
      return null;
    }
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return `${param.label} must be a number`;
      if (param.min !== undefined && value < param.min) return `${param.label} must be at least ${param.min}`;
      if (param.max !== undefined && value > param.max) return `${param.label} must be at most ${param.max}`;
      return null;
    }
    case 'boolean':
      return typeof value === 'boolean' ? null : `${param.label} must be true or false`;
    case 'select':
      return typeof value === 'string' && param.options.includes(value)
        ? null
        : `${param.label} must be one of: ${param.options.join(', ')}`;
  }
}

export function validateValues(
  params: readonly Param[],
  values: Readonly<Record<string, ParamValue>>,
  itemId: string | null,
): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const param of params) {
    const message = problem(param, values[param.key]);
    if (message) errors.push({ itemId, key: param.key, message });
  }
  return errors;
}
