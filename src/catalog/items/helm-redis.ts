import type { CatalogItem } from '../types';
import { releaseName, storageSize } from './shared-helm';

export const helmRedis: CatalogItem = {
  id: 'helm-redis',
  name: 'Redis (Bitnami)',
  description: 'Bitnami Redis chart. The chart generates the password and keeps it in a Secret in the namespace.',
  kind: 'helm',
  category: 'Helm charts',
  params: [
    releaseName('redis'),
    { key: 'architecture', label: 'Architecture', type: 'select', default: 'standalone', options: ['standalone', 'replication'] },
    { key: 'replicas', label: 'Replicas (replication only)', type: 'number', default: 2, min: 1, max: 5 },
    { key: 'auth', label: 'Require a password', type: 'boolean', default: true },
    { key: 'persistence', label: 'Persistent volume', type: 'boolean', default: true },
    storageSize,
    { key: 'metrics', label: 'Metrics exporter', type: 'boolean', default: false },
  ],
  files: [
    {
      path: 'values.yaml',
      language: 'yaml',
      template: `architecture: {{architecture}}
auth:
  enabled: {{auth}}
master:
  persistence:
    enabled: {{persistence}}
    size: "{{size}}"
replica:
  replicaCount: {{replicas}}
  persistence:
    enabled: {{persistence}}
    size: "{{size}}"
metrics:
  enabled: {{metrics}}
`,
    },
  ],
  commands: [
    'helm repo add bitnami https://charts.bitnami.com/bitnami',
    'helm repo update bitnami',
    'helm upgrade --install {{release}} bitnami/redis --namespace {{namespace}} --create-namespace --values {{dir}}/values.yaml',
  ],
};
