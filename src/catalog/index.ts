import { defineCatalog } from './define';
import { awsRdsPostgres } from './items/aws-rds-postgres';
import { awsS3Bucket } from './items/aws-s3-bucket';
import { awsSqsQueue } from './items/aws-sqs-queue';
import { helmClickhouse } from './items/helm-clickhouse';
import { helmIngressNginx } from './items/helm-ingress-nginx';
import { helmPostgresql } from './items/helm-postgresql';
import { helmRedis } from './items/helm-redis';
import { k8sCronJob } from './items/k8s-cronjob';
import { k8sDeployment } from './items/k8s-deployment';
import { k8sImagePullSecret } from './items/k8s-image-pull-secret';
import { k8sNamespace } from './items/k8s-namespace';
import { k8sNetworkPolicy } from './items/k8s-network-policy';
import { tencentCosBucket } from './items/tencent-cos-bucket';

// Order is output order. The namespace comes before the manifests that need it.
export const catalog = defineCatalog([
  awsS3Bucket,
  awsSqsQueue,
  awsRdsPostgres,
  tencentCosBucket,
  helmRedis,
  helmPostgresql,
  helmClickhouse,
  helmIngressNginx,
  k8sNamespace,
  k8sImagePullSecret,
  k8sDeployment,
  k8sCronJob,
  k8sNetworkPolicy,
]);
