import type { Param } from '../types';

export const awsRegion: Param = {
  key: 'region',
  label: 'AWS region',
  type: 'string',
  default: 'us-east-1',
  pattern: '[a-z]{2}(-[a-z]+)+-[0-9]',
};

export const awsProvider = `terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# Credentials come from your AWS profile or environment.
provider "aws" {
  region = "{{region}}"

  default_tags {
    tags = {
      Project     = "{{project}}"
      Environment = "{{env}}"
    }
  }
}
`;
