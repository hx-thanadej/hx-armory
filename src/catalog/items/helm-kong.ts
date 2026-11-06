import type { CatalogItem } from '../types';
import { releaseName } from './shared-helm';

export const helmKong: CatalogItem = {
  id: 'helm-kong',
  name: 'Kong Gateway (Ingress Controller)',
  description:
    'Open source Kong Gateway in DB-less mode with the Kong Ingress Controller, from the kong/ingress chart pinned to 0.24.0. ' +
    'The Admin API is a ClusterIP Service that is never exposed outside the cluster, and Kong Manager is turned off. ' +
    'To route traffic, create an Ingress with ingressClassName: kong, then read the public address from the Service <release>-gateway-proxy. ' +
    'With the controller off, no IngressClass is created and nothing feeds routes to Kong, so you load its configuration yourself.',
  kind: 'helm',
  category: 'Helm charts',
  params: [
    releaseName('kong'),
    { key: 'replicas', label: 'Gateway replicas', type: 'number', default: 2, min: 1, max: 10 },
    {
      key: 'proxy_type',
      label: 'Proxy service type',
      type: 'select',
      default: 'LoadBalancer',
      options: ['LoadBalancer', 'ClusterIP'],
      help: 'Only the proxy that serves your traffic. The Admin API stays ClusterIP either way.',
    },
    { key: 'controller', label: 'Kong Ingress Controller', type: 'boolean', default: true },
    {
      key: 'metrics',
      label: 'Prometheus ServiceMonitor',
      type: 'boolean',
      default: false,
      help: 'Needs the Prometheus Operator CRDs in the cluster, otherwise helm fails.',
    },
  ],
  files: [
    {
      path: 'values.yaml',
      language: 'yaml',
      template: `controller:
  enabled: {{controller}}
gateway:
  replicaCount: {{replicas}}
  proxy:
    type: {{proxy_type}}
  admin:
    type: ClusterIP
  manager:
    enabled: false
  serviceMonitor:
    enabled: {{metrics}}
    trustCRDsExist: {{metrics}}
`,
    },
  ],
  commands: [
    'helm repo add kong https://charts.konghq.com',
    'helm repo update kong',
    'helm upgrade --install {{release}} kong/ingress --version 0.24.0 --namespace {{namespace}} --create-namespace --values {{dir}}/values.yaml',
  ],
};
