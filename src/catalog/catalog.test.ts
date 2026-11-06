import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultContext } from './context';
import { catalog } from './index';
import { render } from './render';
import type { CatalogItem, Selection } from './types';
import { defaultValues } from './validate';

const flipBooleans = (values: Selection['values']): Selection['values'] =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'boolean' ? !value : value]));

const pickOne = (item: CatalogItem, values: Selection['values'] = {}) => {
  const result = render([{ itemId: item.id, values: { ...defaultValues(item.params), ...values } }], defaultContext, catalog);
  if (!result.ok) throw new Error(`${item.id}: ${JSON.stringify(result.errors)}`);
  return result.bundle;
};

const byId = (id: string) => {
  const item = catalog.find((entry) => entry.id === id);
  if (!item) throw new Error(`no item ${id}`);
  return item;
};

describe.each(catalog.map((item) => [item.id, item] as const))('%s', (_id, item) => {
  it('renders with its defaults into non-empty files and commands', () => {
    const bundle = pickOne(item);
    expect(bundle.files.length + (bundle.steps[0]?.commands.length ?? 0)).toBeGreaterThan(0);
    for (const file of bundle.files) {
      expect(file.content.trim()).not.toBe('');
      expect(file.path.startsWith(`${item.id}/`)).toBe(true);
      expect(file.content).not.toContain('{{');
    }
    expect(bundle.steps[0]?.commands.length).toBeGreaterThan(0);
  });

  it('renders with every boolean flipped', () => {
    const bundle = pickOne(item, flipBooleans(defaultValues(item.params)));
    for (const file of bundle.files) expect(file.content.trim()).not.toBe('');
  });
});

describe('the whole catalog at once', () => {
  const selections = catalog.map((item) => ({ itemId: item.id, values: {} }));
  const result = render(selections, defaultContext, catalog);

  it('renders every item together', () => {
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.bundle.steps).toHaveLength(catalog.length);
  });

  it('produces a deploy.sh that passes bash -n', () => {
    if (!result.ok) throw new Error('render failed');
    expect(() => execFileSync('bash', ['-n'], { input: result.bundle.script })).not.toThrow();
  });
});

describe('item behavior', () => {
  const main = (bundle: ReturnType<typeof pickOne>) => bundle.files[0]?.content ?? '';

  it('S3 drops versioning and the public access block when switched off', () => {
    const item = byId('aws-s3-bucket');
    expect(main(pickOne(item))).toContain('aws_s3_bucket_versioning');
    const off = main(pickOne(item, { versioning: false, block_public_access: false }));
    expect(off).not.toContain('aws_s3_bucket_versioning');
    expect(off).not.toContain('aws_s3_bucket_public_access_block');
    expect(off).toContain('aws_s3_bucket_server_side_encryption_configuration');
  });

  it('SQS adds the dead letter queue and redrive policy only when asked', () => {
    const item = byId('aws-sqs-queue');
    const on = main(pickOne(item, { dlq: true, max_receive_count: 9 }));
    expect(on).toContain('aws_sqs_queue" "dlq"');
    expect(on).toContain('maxReceiveCount     = 9');
    const off = main(pickOne(item, { dlq: false }));
    expect(off).not.toContain('dlq');
    expect(off).not.toContain('redrive_policy');
  });

  it('the Deployment adds an Ingress for the chosen host only when enabled', () => {
    const item = byId('k8s-deployment');
    expect(main(pickOne(item))).not.toContain('kind: Ingress');
    expect(main(pickOne(item, { ingress: true, host: 'shop.example.org' }))).toContain('host: "shop.example.org"');
  });

  it('RDS lets AWS manage the master password instead of writing one', () => {
    const hcl = main(pickOne(byId('aws-rds-postgres')));
    expect(hcl).toContain('manage_master_user_password = true');
    expect(hcl).not.toMatch(/^\s*password\s*=/m);
  });

  it('the pull secret reads its password from the environment', () => {
    const commands = pickOne(byId('k8s-image-pull-secret')).steps[0]?.commands.join('\n') ?? '';
    expect(commands).toContain('${REGISTRY_PASSWORD:?');
  });

  it('shares the namespace and project across items', () => {
    const ctx = { project: 'shop', env: 'prod', namespace: 'web' };
    const result = render(
      [{ itemId: 'helm-redis', values: {} }, { itemId: 'aws-s3-bucket', values: {} }],
      ctx,
      catalog,
    );
    if (!result.ok) throw new Error('render failed');
    expect(result.bundle.script).toContain('--namespace web');
    expect(result.bundle.script).toContain('bucket        = "shop-prod-assets"');
  });
});

describe('catalog import', () => {
  afterEach(() => {
    vi.doUnmock('./items/aws-s3-bucket');
    vi.resetModules();
  });

  const importWith = async (change: (item: CatalogItem) => CatalogItem) => {
    vi.resetModules();
    vi.doMock('./items/aws-s3-bucket', async (importOriginal) => {
      const real = await importOriginal<typeof import('./items/aws-s3-bucket')>();
      return { ...real, awsS3Bucket: change(real.awsS3Bucket) };
    });
    return import('./index');
  };

  it('succeeds for the shipped catalog', async () => {
    await expect(importWith((item) => item)).resolves.toHaveProperty('catalog');
  });

  it('fails on a duplicate item id', async () => {
    await expect(importWith((item) => ({ ...item, id: 'aws-sqs-queue' }))).rejects.toThrow(/Duplicate item id "aws-sqs-queue"/);
  });

  it.each(['project', 'env', 'namespace', 'dir'])('fails on a param key that shadows the context key %s', async (key) => {
    const shadow = (item: CatalogItem): CatalogItem => ({
      ...item,
      params: [...item.params, { key, label: 'Shadow', type: 'boolean', default: true }],
    });
    await expect(importWith(shadow)).rejects.toThrow(new RegExp(`"${key}".*shadows a context key`));
  });

  it('fails on a string param without a pattern', async () => {
    const loose = (item: CatalogItem): CatalogItem => ({
      ...item,
      params: [...item.params, { key: 'free', label: 'Free', type: 'string', default: 'x' }],
    });
    await expect(importWith(loose)).rejects.toThrow(/needs a pattern/);
  });
});
