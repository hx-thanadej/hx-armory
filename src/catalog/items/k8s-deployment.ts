import type { CatalogItem } from '../types';

export const k8sDeployment: CatalogItem = {
  id: 'k8s-deployment',
  name: 'Deployment and Service',
  description: 'A Deployment with a ClusterIP Service on port 80 and an optional Ingress. Needs the namespace to exist.',
  kind: 'manifest',
  category: 'Kubernetes',
  params: [
    { key: 'app_name', label: 'App name', type: 'string', default: 'web', pattern: '[a-z]([a-z0-9-]{0,40}[a-z0-9])?' },
    {
      key: 'image',
      label: 'Container image',
      type: 'string',
      default: 'nginxinc/nginx-unprivileged:stable',
      pattern: '[A-Za-z0-9][A-Za-z0-9._/:@-]{0,254}',
    },
    { key: 'port', label: 'Container port', type: 'number', default: 8080, min: 1, max: 65535 },
    { key: 'replicas', label: 'Replicas', type: 'number', default: 2, min: 1, max: 50 },
    { key: 'cpu', label: 'CPU request', type: 'string', default: '100m', pattern: '[0-9]+m?' },
    { key: 'memory', label: 'Memory request and limit', type: 'string', default: '128Mi', pattern: '[0-9]+(Mi|Gi)' },
    { key: 'probes', label: 'Readiness probe', type: 'boolean', default: true },
    { key: 'health_path', label: 'Probe path', type: 'string', default: '/', pattern: '/[A-Za-z0-9/_.-]*' },
    { key: 'ingress', label: 'Ingress', type: 'boolean', default: false },
    {
      key: 'host',
      label: 'Ingress host',
      type: 'string',
      default: 'app.example.com',
      pattern: '[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?',
    },
    { key: 'ingress_class', label: 'Ingress class', type: 'string', default: 'nginx', pattern: '[a-z]([a-z0-9-]{0,40}[a-z0-9])?' },
  ],
  files: [
    {
      path: 'manifest.yaml',
      language: 'yaml',
      template: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: "{{app_name}}"
  namespace: "{{namespace}}"
  labels:
    app.kubernetes.io/name: "{{app_name}}"
    app.kubernetes.io/part-of: "{{project}}"
spec:
  replicas: {{replicas}}
  selector:
    matchLabels:
      app.kubernetes.io/name: "{{app_name}}"
  template:
    metadata:
      labels:
        app.kubernetes.io/name: "{{app_name}}"
    spec:
      containers:
        - name: "{{app_name}}"
          image: "{{image}}"
          ports:
            - name: http
              containerPort: {{port}}
          resources:
            requests:
              cpu: "{{cpu}}"
              memory: "{{memory}}"
            limits:
              memory: "{{memory}}"
{{#if probes}}
          readinessProbe:
            httpGet:
              path: "{{health_path}}"
              port: http
{{/if}}
---
apiVersion: v1
kind: Service
metadata:
  name: "{{app_name}}"
  namespace: "{{namespace}}"
  labels:
    app.kubernetes.io/name: "{{app_name}}"
spec:
  selector:
    app.kubernetes.io/name: "{{app_name}}"
  ports:
    - name: http
      port: 80
      targetPort: http
{{#if ingress}}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: "{{app_name}}"
  namespace: "{{namespace}}"
spec:
  ingressClassName: "{{ingress_class}}"
  rules:
    - host: "{{host}}"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: "{{app_name}}"
                port:
                  name: http
{{/if}}
`,
    },
  ],
  commands: [
    'kubectl apply -f {{dir}}/manifest.yaml',
    'kubectl rollout status deployment/{{app_name}} --namespace {{namespace}} --timeout=120s',
  ],
};
