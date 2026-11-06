import type { CatalogItem } from '../types';
import { releaseName } from './shared-helm';

export const helmArgoCd: CatalogItem = {
  id: 'helm-argo-cd',
  name: 'Argo CD',
  description:
    'The argo/argo-cd chart. HA mode runs Redis HA plus two replicas of the server, repo server and ApplicationSet controller, and needs at least three nodes. ' +
    'The last command prints the initial admin password from the Secret argocd-initial-admin-secret. Delete that Secret once you have changed the password.',
  kind: 'helm',
  category: 'Helm charts',
  params: [
    releaseName('argocd'),
    { key: 'ha', label: 'High availability mode', type: 'boolean', default: false },
    { key: 'service_type', label: 'Server service type', type: 'select', default: 'ClusterIP', options: ['ClusterIP', 'LoadBalancer'] },
    { key: 'ingress', label: 'Ingress', type: 'boolean', default: false },
    {
      key: 'host',
      label: 'Ingress host',
      type: 'string',
      default: 'argocd.example.com',
      pattern: '[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?',
    },
    {
      key: 'insecure',
      label: 'TLS terminated upstream',
      type: 'boolean',
      default: false,
      help: 'Serves the server over plain HTTP (server.insecure) for an ingress or load balancer that terminates TLS. Without it, an ingress needs HTTPS to the backend or SSL passthrough.',
    },
  ],
  files: [
    {
      path: 'values.yaml',
      language: 'yaml',
      template: `{{#if ingress}}
global:
  domain: "{{host}}"
{{/if}}
configs:
  params:
    server.insecure: {{insecure}}
{{#if ha}}
redis-ha:
  enabled: true
repoServer:
  replicas: 2
applicationSet:
  replicas: 2
{{/if}}
server:
{{#if ha}}
  replicas: 2
{{/if}}
  service:
    type: {{service_type}}
{{#if ingress}}
  ingress:
    enabled: true
{{/if}}
`,
    },
  ],
  commands: [
    'helm repo add argo https://argoproj.github.io/argo-helm',
    'helm repo update argo',
    'helm upgrade --install {{release}} argo/argo-cd --version 10.14.0 --namespace {{namespace}} --create-namespace --values {{dir}}/values.yaml --wait --timeout 10m',
    '(kubectl get secret argocd-initial-admin-secret --namespace {{namespace}} -o jsonpath="{.data.password}" | base64 -d && echo) || echo "argocd-initial-admin-secret not found"',
  ],
};
