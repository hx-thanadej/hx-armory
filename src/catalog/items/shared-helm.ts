import type { Param } from '../types';

export const releaseName = (fallback: string): Param => ({
  key: 'release',
  label: 'Release name',
  type: 'string',
  default: fallback,
  pattern: '[a-z]([a-z0-9-]{0,30}[a-z0-9])?',
});

export const storageSize: Param = {
  key: 'size',
  label: 'Volume size',
  type: 'string',
  default: '8Gi',
  pattern: '[0-9]+(Mi|Gi|Ti)',
  help: 'A Kubernetes quantity such as 8Gi.',
};
