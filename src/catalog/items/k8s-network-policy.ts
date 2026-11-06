import type { CatalogItem } from '../types';

export const k8sNetworkPolicy: CatalogItem = {
  id: 'k8s-network-policy',
  name: 'Default deny NetworkPolicy',
  description: 'Denies all ingress to every pod in the namespace, and optionally egress too. The cluster needs a CNI that enforces NetworkPolicy.',
  kind: 'manifest',
  category: 'Kubernetes',
  params: [
    { key: 'deny_egress', label: 'Also deny egress', type: 'boolean', default: false },
    { key: 'allow_dns', label: 'Allow DNS egress to kube-system', type: 'boolean', default: true },
  ],
  files: [
    {
      path: 'network-policy.yaml',
      language: 'yaml',
      template: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: "{{namespace}}"
spec:
  podSelector: {}
  policyTypes:
    - Ingress
{{#if deny_egress}}
    - Egress
{{/if}}
{{#if allow_dns}}
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: "{{namespace}}"
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
{{/if}}
`,
    },
  ],
  commands: ['kubectl apply -f {{dir}}/network-policy.yaml'],
};
