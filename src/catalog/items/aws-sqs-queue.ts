import type { CatalogItem } from '../types';
import { awsProvider, awsRegion } from './shared';

export const awsSqsQueue: CatalogItem = {
  id: 'aws-sqs-queue',
  name: 'SQS queue',
  description: 'Standard SQS queue with an optional dead letter queue.',
  kind: 'terraform',
  category: 'AWS',
  params: [
    {
      key: 'suffix',
      label: 'Queue suffix',
      type: 'string',
      default: 'jobs',
      pattern: '[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?',
      help: 'The queue is named <project>-<env>-<suffix>.',
    },
    awsRegion,
    { key: 'dlq', label: 'Dead letter queue', type: 'boolean', default: true },
    { key: 'max_receive_count', label: 'Receives before dead letter', type: 'number', default: 5, min: 1, max: 1000 },
    { key: 'visibility_timeout', label: 'Visibility timeout (seconds)', type: 'number', default: 30, min: 0, max: 43200 },
    { key: 'retention_days', label: 'Message retention (days)', type: 'number', default: 4, min: 1, max: 14 },
  ],
  files: [
    {
      path: 'main.tf',
      language: 'hcl',
      template: `${awsProvider}
{{#if dlq}}
resource "aws_sqs_queue" "dlq" {
  name                      = "{{project}}-{{env}}-{{suffix}}-dlq"
  message_retention_seconds = 1209600
}

{{/if}}
resource "aws_sqs_queue" "this" {
  name                       = "{{project}}-{{env}}-{{suffix}}"
  visibility_timeout_seconds = {{visibility_timeout}}
  message_retention_seconds  = {{retention_days}} * 86400
{{#if dlq}}

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = {{max_receive_count}}
  })
{{/if}}
}

output "queue_url" {
  value = aws_sqs_queue.this.url
}

output "queue_arn" {
  value = aws_sqs_queue.this.arn
}
`,
    },
  ],
  commands: [
    'terraform -chdir={{dir}} init',
    'terraform -chdir={{dir}} plan',
    'terraform -chdir={{dir}} apply',
  ],
};
