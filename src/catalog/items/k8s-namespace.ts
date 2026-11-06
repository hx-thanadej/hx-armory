import type { CatalogItem } from '../types';

export const k8sNamespace: CatalogItem = {
  id: 'k8s-namespace',
  name: 'Create namespace',
  description: 'Creates the shared namespace. Safe to run again when it already exists.',
  kind: 'command',
  category: 'Kubernetes',
  params: [],
  files: [],
  commands: ['kubectl create namespace {{namespace}} --dry-run=client -o yaml | kubectl apply -f -'],
};
