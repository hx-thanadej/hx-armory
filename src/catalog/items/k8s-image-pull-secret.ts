import type { CatalogItem } from '../types';

export const k8sImagePullSecret: CatalogItem = {
  id: 'k8s-image-pull-secret',
  name: 'Create image pull secret',
  description: 'Registry credentials as a pull secret. The password is read from REGISTRY_PASSWORD in your shell and never appears in the output.',
  kind: 'command',
  category: 'Kubernetes',
  params: [
    { key: 'secret_name', label: 'Secret name', type: 'string', default: 'regcred', pattern: '[a-z]([a-z0-9-]{0,40}[a-z0-9])?' },
    {
      key: 'server',
      label: 'Registry server',
      type: 'string',
      default: 'registry.example.com',
      pattern: '[A-Za-z0-9][A-Za-z0-9._:/-]{0,100}',
    },
    { key: 'username', label: 'Registry username', type: 'string', default: 'ci-user', pattern: '[A-Za-z0-9._@+-]{1,100}' },
  ],
  files: [],
  commands: [
    'kubectl create secret docker-registry {{secret_name}} --namespace {{namespace}} --docker-server={{server}} --docker-username={{username}} --docker-password="${REGISTRY_PASSWORD:?set REGISTRY_PASSWORD first}" --dry-run=client -o yaml | kubectl apply -f -',
  ],
};
