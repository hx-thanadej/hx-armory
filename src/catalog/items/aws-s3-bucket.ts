import type { CatalogItem } from '../types';
import { awsProvider, awsRegion } from './shared';

export const awsS3Bucket: CatalogItem = {
  id: 'aws-s3-bucket',
  name: 'S3 bucket',
  description: 'Private S3 bucket with encryption, optional versioning and a public access block.',
  kind: 'terraform',
  category: 'AWS',
  params: [
    {
      key: 'suffix',
      label: 'Bucket suffix',
      type: 'string',
      default: 'assets',
      pattern: '[a-z0-9]([a-z0-9-]{0,22}[a-z0-9])?',
      help: 'The bucket is named <project>-<env>-<suffix>.',
    },
    awsRegion,
    { key: 'versioning', label: 'Versioning', type: 'boolean', default: true },
    { key: 'encryption', label: 'Encryption', type: 'select', default: 'AES256', options: ['AES256', 'aws:kms'] },
    { key: 'block_public_access', label: 'Block public access', type: 'boolean', default: true },
    {
      key: 'force_destroy',
      label: 'Allow destroy when not empty',
      type: 'boolean',
      default: false,
    },
  ],
  files: [
    {
      path: 'main.tf',
      language: 'hcl',
      template: `${awsProvider}
resource "aws_s3_bucket" "this" {
  bucket        = "{{project}}-{{env}}-{{suffix}}"
  force_destroy = {{force_destroy}}
}

{{#if versioning}}
resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

{{/if}}
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "{{encryption}}"
    }
  }
}

{{#if block_public_access}}
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

{{/if}}
output "bucket_name" {
  value = aws_s3_bucket.this.bucket
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
