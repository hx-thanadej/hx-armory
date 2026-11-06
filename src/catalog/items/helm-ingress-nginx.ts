import type { CatalogItem } from '../types';

export const helmIngressNginx: CatalogItem = {
  id: 'helm-ingress-nginx',
  name: 'ingress-nginx',
  description: 'The Kubernetes ingress-nginx controller, installed in its own ingress-nginx namespace.',
  kind: 'helm',
  category: 'Helm charts',
  params: [
    { key: 'replicas', label: 'Controller replicas', type: 'number', default: 2, min: 1, max: 10 },
    {
      key: 'service_type',
      label: 'Service type',
      type: 'select',
      default: 'LoadBalancer',
      options: ['LoadBalancer', 'NodePort', 'ClusterIP'],
    },
    { key: 'default_class', label: 'Default ingress class', type: 'boolean', default: true },
    { key: 'metrics', label: 'Metrics', type: 'boolean', default: false },
  ],
  files: [
    {
      path: 'values.yaml',
      language: 'yaml',
      template: `controller:
  replicaCount: {{replicas}}
  service:
    type: {{service_type}}
  ingressClassResource:
    default: {{default_class}}
  metrics:
    enabled: {{metrics}}
`,
    },
  ],
  commands: [
    'helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx',
    'helm repo update ingress-nginx',
    'helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace --values {{dir}}/values.yaml',
  ],
};
