import type { CatalogItem } from '../types';
import { releaseName, storageSize } from './shared-helm';

export const helmPostgresql: CatalogItem = {
  id: 'helm-postgresql',
  name: 'PostgreSQL (Bitnami)',
  description: 'Bitnami PostgreSQL chart. The chart generates the passwords and keeps them in a Secret in the namespace.',
  kind: 'helm',
  category: 'Helm charts',
  params: [
    releaseName('postgresql'),
    { key: 'username', label: 'Application user', type: 'string', default: 'app', pattern: '[a-z][a-z0-9_]{0,30}' },
    { key: 'database', label: 'Database name', type: 'string', default: 'app', pattern: '[a-z][a-z0-9_]{0,62}' },
    { key: 'architecture', label: 'Architecture', type: 'select', default: 'standalone', options: ['standalone', 'replication'] },
    { key: 'read_replicas', label: 'Read replicas (replication only)', type: 'number', default: 1, min: 1, max: 5 },
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
  username: "{{username}}"
  database: "{{database}}"
primary:
  persistence:
    enabled: {{persistence}}
    size: "{{size}}"
readReplicas:
  replicaCount: {{read_replicas}}
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
    'helm upgrade --install {{release}} bitnami/postgresql --namespace {{namespace}} --create-namespace --values {{dir}}/values.yaml',
  ],
};
