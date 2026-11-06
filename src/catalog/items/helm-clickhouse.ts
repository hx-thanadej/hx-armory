import type { CatalogItem } from '../types';
import { releaseName, storageSize } from './shared-helm';

// Server and Keeper share one version so replicas and coordination never drift apart.
const clickhouseTag = '25.8.9.20';

export const helmClickhouse: CatalogItem = {
  id: 'helm-clickhouse',
  name: 'ClickHouse cluster (Altinity operator)',
  description:
    'A sharded, replicated ClickHouse cluster named "main" with a ClickHouse Keeper ensemble, run by the Altinity operator. ' +
    'The Bitnami chart is not used because its images are no longer published at docker.io/bitnami. ' +
    'The operator is installed once per Kubernetes cluster in the clickhouse-operator namespace and watches every namespace. ' +
    'deploy.sh generates the password of the app user and keeps it in the Secret <release>-credentials, never in a file. ' +
    'Read it with kubectl get secret <release>-credentials --namespace <namespace> -o jsonpath="{.data.password}" | base64 -d. ' +
    'Clients connect to the service clickhouse-<release>. No pod anti-affinity is set, so add it for production.',
  kind: 'helm',
  category: 'Helm charts',
  params: [
    releaseName('clickhouse'),
    { key: 'shards', label: 'Shards', type: 'number', default: 2, min: 1, max: 10 },
    { key: 'replicas', label: 'Replicas per shard', type: 'number', default: 2, min: 1, max: 5 },
    {
      key: 'keeper_replicas',
      label: 'Keeper replicas',
      type: 'select',
      default: '3',
      options: ['1', '3', '5'],
      help: 'Keeper needs an odd number of nodes to keep a quorum.',
    },
    { key: 'persistence', label: 'Persistent volumes', type: 'boolean', default: true },
    { ...storageSize, label: 'Data volume size per replica' },
    {
      key: 'metrics',
      label: 'Prometheus metrics endpoint',
      type: 'boolean',
      default: false,
      help: 'Serves /metrics on ClickHouse (9363) and Keeper (7000) and adds scrape annotations.',
    },
  ],
  files: [
    {
      path: 'operator-values.yaml',
      language: 'yaml',
      template: `configs:
  files:
    config.yaml:
      watch:
        namespaces:
          include: [".*"]
`,
    },
    {
      path: 'keeper.yaml',
      language: 'yaml',
      template: `apiVersion: clickhouse-keeper.altinity.com/v1
kind: ClickHouseKeeperInstallation
metadata:
  name: {{release}}-keeper
  namespace: {{namespace}}
spec:
  configuration:
    clusters:
      - name: main
        layout:
          replicasCount: {{keeper_replicas}}
{{#if metrics}}
    settings:
      prometheus/endpoint: /metrics
      prometheus/port: 7000
      prometheus/metrics: true
      prometheus/events: true
      prometheus/asynchronous_metrics: true
{{/if}}
  defaults:
    templates:
      podTemplate: keeper
{{#if persistence}}
      dataVolumeClaimTemplate: data
{{/if}}
  templates:
    podTemplates:
      - name: keeper
{{#if metrics}}
        metadata:
          annotations:
            prometheus.io/scrape: "true"
            prometheus.io/path: /metrics
            prometheus.io/port: "7000"
{{/if}}
        spec:
          containers:
            - name: clickhouse-keeper
              image: clickhouse/clickhouse-keeper:${clickhouseTag}
          securityContext:
            fsGroup: 101
{{#if persistence}}
    volumeClaimTemplates:
      - name: data
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 5Gi
{{/if}}
`,
    },
    {
      path: 'clickhouse.yaml',
      language: 'yaml',
      template: `apiVersion: clickhouse.altinity.com/v1
kind: ClickHouseInstallation
metadata:
  name: {{release}}
  namespace: {{namespace}}
spec:
  defaults:
    templates:
      podTemplate: clickhouse
{{#if persistence}}
      dataVolumeClaimTemplate: data
{{/if}}
  configuration:
    zookeeper:
      keeper:
        name: {{release}}-keeper
    users:
      app/password:
        valueFrom:
          secretKeyRef:
            name: {{release}}-credentials
            key: password
      app/networks/ip: "::/0"
      app/profile: default
{{#if metrics}}
    settings:
      prometheus/endpoint: /metrics
      prometheus/port: 9363
      prometheus/metrics: true
      prometheus/events: true
      prometheus/asynchronous_metrics: true
{{/if}}
    clusters:
      - name: main
        layout:
          shardsCount: {{shards}}
          replicasCount: {{replicas}}
  templates:
    podTemplates:
      - name: clickhouse
{{#if metrics}}
        metadata:
          annotations:
            prometheus.io/scrape: "true"
            prometheus.io/path: /metrics
            prometheus.io/port: "9363"
{{/if}}
        spec:
          containers:
            - name: clickhouse
              image: clickhouse/clickhouse-server:${clickhouseTag}
{{#if metrics}}
              ports:
                - name: metrics
                  containerPort: 9363
{{/if}}
{{#if persistence}}
    volumeClaimTemplates:
      - name: data
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: "{{size}}"
{{/if}}
`,
    },
  ],
  commands: [
    'helm repo add altinity https://docs.altinity.com/helm-charts/',
    'helm repo update altinity',
    'helm upgrade --install clickhouse-operator altinity/altinity-clickhouse-operator --version 0.27.4 --namespace clickhouse-operator --create-namespace --values {{dir}}/operator-values.yaml --wait',
    'kubectl create namespace {{namespace}} --dry-run=client -o yaml | kubectl apply -f -',
    'kubectl get secret {{release}}-credentials --namespace {{namespace}} > /dev/null 2>&1 || kubectl create secret generic {{release}}-credentials --namespace {{namespace}} --from-literal=password="$(openssl rand -hex 24)"',
    'kubectl apply -f {{dir}}/keeper.yaml',
    'kubectl apply -f {{dir}}/clickhouse.yaml',
    'kubectl get chk,chi --namespace {{namespace}}',
  ],
};
