import type { CatalogItem } from '../types';

export const tencentCosBucket: CatalogItem = {
  id: 'tencent-cos-bucket',
  name: 'COS bucket',
  description: 'Tencent Cloud COS bucket. Authenticate with TENCENTCLOUD_SECRET_ID and TENCENTCLOUD_SECRET_KEY in your shell.',
  kind: 'terraform',
  category: 'Tencent Cloud',
  params: [
    {
      key: 'suffix',
      label: 'Bucket suffix',
      type: 'string',
      default: 'assets',
      pattern: '[a-z0-9]([a-z0-9-]{0,16}[a-z0-9])?',
      help: 'The bucket is named <project>-<env>-<suffix>-<appid>.',
    },
    {
      key: 'appid',
      label: 'Tencent Cloud APPID',
      type: 'string',
      default: '1250000000',
      pattern: '[0-9]{7,12}',
      help: 'COS requires the account APPID in the bucket name. Replace the placeholder.',
    },
    { key: 'region', label: 'Region', type: 'string', default: 'ap-guangzhou', pattern: '[a-z]{2}-[a-z]+(-[0-9]+)?' },
    { key: 'acl', label: 'Access', type: 'select', default: 'private', options: ['private', 'public-read'] },
    { key: 'versioning', label: 'Versioning', type: 'boolean', default: true },
    { key: 'force_clean', label: 'Allow destroy when not empty', type: 'boolean', default: false },
  ],
  files: [
    {
      path: 'main.tf',
      language: 'hcl',
      template: `terraform {
  required_version = ">= 1.5"

  required_providers {
    tencentcloud = {
      source  = "tencentcloudstack/tencentcloud"
      version = "~> 1.81"
    }
  }
}

provider "tencentcloud" {
  region = "{{region}}"
}

resource "tencentcloud_cos_bucket" "this" {
  bucket               = "{{project}}-{{env}}-{{suffix}}-{{appid}}"
  acl                  = "{{acl}}"
  versioning_enable    = {{versioning}}
  force_clean          = {{force_clean}}
  encryption_algorithm = "AES256"
}

output "bucket" {
  value = tencentcloud_cos_bucket.this.bucket
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
