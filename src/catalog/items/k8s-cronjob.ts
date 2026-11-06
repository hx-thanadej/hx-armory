import type { CatalogItem } from '../types';

export const k8sCronJob: CatalogItem = {
  id: 'k8s-cronjob',
  name: 'CronJob',
  description: 'Runs a shell command in a container on a schedule. Needs the namespace to exist.',
  kind: 'manifest',
  category: 'Kubernetes',
  params: [
    { key: 'job_name', label: 'Job name', type: 'string', default: 'nightly', pattern: '[a-z]([a-z0-9-]{0,40}[a-z0-9])?' },
    {
      key: 'schedule',
      label: 'Schedule (cron)',
      type: 'string',
      default: '0 2 * * *',
      pattern: '[0-9*/,-]+( [0-9*/,-]+){4}',
      help: 'Five fields: minute hour day month weekday.',
    },
    {
      key: 'image',
      label: 'Container image',
      type: 'string',
      default: 'busybox:1.36',
      pattern: '[A-Za-z0-9][A-Za-z0-9._/:@-]{0,254}',
    },
    {
      key: 'script',
      label: 'Shell command',
      type: 'string',
      default: 'echo hello from cron',
      pattern: '[A-Za-z0-9 ._/:=,@%+-]+',
      help: 'Letters, digits, spaces and . _ / : = , @ % + - only.',
    },
    {
      key: 'concurrency',
      label: 'Concurrency policy',
      type: 'select',
      default: 'Forbid',
      options: ['Allow', 'Forbid', 'Replace'],
    },
    { key: 'backoff_limit', label: 'Retries per run', type: 'number', default: 2, min: 0, max: 10 },
  ],
  files: [
    {
      path: 'cronjob.yaml',
      language: 'yaml',
      template: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: "{{job_name}}"
  namespace: "{{namespace}}"
  labels:
    app.kubernetes.io/part-of: "{{project}}"
spec:
  schedule: "{{schedule}}"
  concurrencyPolicy: {{concurrency}}
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      backoffLimit: {{backoff_limit}}
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: "{{job_name}}"
              image: "{{image}}"
              command: ["/bin/sh", "-c", "{{script}}"]
`,
    },
  ],
  commands: [
    'kubectl apply -f {{dir}}/cronjob.yaml',
    'kubectl get cronjob {{job_name}} --namespace {{namespace}}',
  ],
};
