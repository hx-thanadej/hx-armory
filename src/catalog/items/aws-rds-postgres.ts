import type { CatalogItem } from '../types';
import { awsProvider, awsRegion } from './shared';

export const awsRdsPostgres: CatalogItem = {
  id: 'aws-rds-postgres',
  name: 'RDS PostgreSQL',
  description:
    'Small encrypted PostgreSQL instance in the default VPC. AWS manages the master password in Secrets Manager, so none is generated here.',
  kind: 'terraform',
  category: 'AWS',
  params: [
    awsRegion,
    { key: 'engine_version', label: 'PostgreSQL major version', type: 'select', default: '16', options: ['15', '16', '17'] },
    {
      key: 'instance_class',
      label: 'Instance class',
      type: 'select',
      default: 'db.t4g.micro',
      options: ['db.t4g.micro', 'db.t4g.small', 'db.t4g.medium'],
    },
    { key: 'allocated_storage', label: 'Storage (GB)', type: 'number', default: 20, min: 20, max: 1000 },
    { key: 'db_name', label: 'Database name', type: 'string', default: 'app', pattern: '[a-z][a-z0-9_]{0,62}' },
    {
      key: 'username',
      label: 'Master username',
      type: 'string',
      default: 'appadmin',
      pattern: '[a-z][a-z0-9_]{0,15}',
      help: 'The name admin is reserved by RDS.',
    },
    { key: 'multi_az', label: 'Multi AZ', type: 'boolean', default: false },
    { key: 'backup_retention_period', label: 'Backup retention (days)', type: 'number', default: 7, min: 0, max: 35 },
    { key: 'deletion_protection', label: 'Deletion protection', type: 'boolean', default: false },
    {
      key: 'skip_final_snapshot',
      label: 'Skip final snapshot on destroy',
      type: 'boolean',
      default: false,
    },
  ],
  files: [
    {
      path: 'main.tf',
      language: 'hcl',
      template: `${awsProvider}
resource "aws_db_instance" "this" {
  identifier = "{{project}}-{{env}}-postgres"

  engine         = "postgres"
  engine_version = "{{engine_version}}"
  instance_class = "{{instance_class}}"

  allocated_storage = {{allocated_storage}}
  storage_type      = "gp3"
  storage_encrypted = true

  db_name                     = "{{db_name}}"
  username                    = "{{username}}"
  manage_master_user_password = true

  multi_az                = {{multi_az}}
  publicly_accessible     = false
  backup_retention_period = {{backup_retention_period}}
  deletion_protection     = {{deletion_protection}}

  skip_final_snapshot       = {{skip_final_snapshot}}
  final_snapshot_identifier = "{{project}}-{{env}}-postgres-final"
}

output "endpoint" {
  value = aws_db_instance.this.endpoint
}

output "master_user_secret_arn" {
  value = aws_db_instance.this.master_user_secret[0].secret_arn
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
