import type { Context, Param } from './types';

export const contextParams: readonly Param[] = [
  {
    key: 'project',
    label: 'Project',
    type: 'string',
    default: 'myapp',
    pattern: '[a-z]([a-z0-9-]{0,18}[a-z0-9])?',
    help: 'Lowercase letters, digits and hyphens. Prefixes resource names.',
  },
  { key: 'env', label: 'Environment', type: 'select', default: 'dev', options: ['dev', 'staging', 'prod'] },
  {
    key: 'namespace',
    label: 'Kubernetes namespace',
    type: 'string',
    default: 'app',
    pattern: '[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?',
    help: 'Used by Helm and kubectl items.',
  },
];

export const defaultContext = Object.fromEntries(
  contextParams.map((param) => [param.key, param.default]),
) as Context;

// Template variables the renderer owns. A catalog param may not reuse them.
export const reservedKeys: ReadonlySet<string> = new Set([...contextParams.map((p) => p.key), 'dir']);
