import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultContext } from './context';
import { render } from './render';
import { TemplateError } from './template';
import type { CatalogItem, Context, Selection } from './types';

const demo: CatalogItem = {
  id: 'demo',
  name: 'Demo item',
  description: 'fixture',
  kind: 'terraform',
  category: 'Test',
  params: [
    { key: 'name', label: 'Name', type: 'string', default: 'alpha', pattern: '[a-z]{2,8}' },
    { key: 'size', label: 'Size', type: 'number', default: 5, min: 1, max: 10 },
    { key: 'tier', label: 'Tier', type: 'select', default: 'small', options: ['small', 'large'] },
    { key: 'extra', label: 'Extra', type: 'boolean', default: false },
  ],
  files: [
    {
      path: 'main.tf',
      language: 'hcl',
      template: 'name={{name}} size={{size}} tier={{tier}} env={{env}} dir={{dir}}\n{{#if extra}}\nextra=1\n{{/if}}\n',
    },
    { path: 'nested/deep.yaml', language: 'yaml', template: 'project: {{project}}' },
  ],
  commands: ['echo apply {{dir}} in {{namespace}}'],
};

const other: CatalogItem = {
  id: 'other',
  name: 'Other item',
  description: 'fixture',
  kind: 'command',
  category: 'Test',
  params: [],
  files: [],
  commands: ['echo other'],
};

const items = [demo, other];
const pick = (...selections: Selection[]) => render(selections, defaultContext, items);
const ok = (result: ReturnType<typeof render>) => {
  if (!result.ok) throw new Error(`expected success, got ${JSON.stringify(result.errors)}`);
  return result.bundle;
};

describe('output', () => {
  it('writes files under <item id>/<file path> with the template filled in', () => {
    const bundle = ok(pick({ itemId: 'demo', values: {} }));
    expect(bundle.files.map((file) => file.path)).toEqual(['demo/main.tf', 'demo/nested/deep.yaml']);
    expect(bundle.files[0]?.content).toBe('name=alpha size=5 tier=small env=dev dir=demo\n');
    expect(bundle.files[1]?.content).toBe('project: myapp\n');
  });

  it('uses supplied values over defaults and shares the context', () => {
    const ctx: Context = { project: 'shop', env: 'prod', namespace: 'web' };
    const result = render([{ itemId: 'demo', values: { name: 'beta', extra: true } }], ctx, items);
    const bundle = ok(result);
    expect(bundle.files[0]?.content).toBe('name=beta size=5 tier=small env=prod dir=demo\nextra=1\n');
    expect(bundle.steps[0]?.commands).toEqual(['echo apply demo in web']);
  });

  it('orders output by catalog order, not selection order', () => {
    const bundle = ok(pick({ itemId: 'other', values: {} }, { itemId: 'demo', values: {} }));
    expect(bundle.steps.map((step) => step.itemId)).toEqual(['demo', 'other']);
  });

  it('returns an empty bundle for an empty selection', () => {
    const bundle = ok(pick());
    expect(bundle.files).toEqual([]);
    expect(bundle.steps).toEqual([]);
  });

  it('lets a template error for a wrong catalog entry throw', () => {
    const broken: CatalogItem = { ...other, id: 'broken', files: [{ path: 'a', language: 'sh', template: '{{ghost}}' }] };
    expect(() => render([{ itemId: 'broken', values: {} }], defaultContext, [broken])).toThrow(TemplateError);
  });
});

describe('validation', () => {
  const errorsFor = (values: Selection['values'], ctx: Context = defaultContext) => {
    const result = render([{ itemId: 'demo', values }], ctx, items);
    if (result.ok) throw new Error('expected validation errors');
    return result.errors;
  };

  it('rejects a string that does not match its pattern', () => {
    expect(errorsFor({ name: 'Bad Name!' })).toEqual([
      expect.objectContaining({ itemId: 'demo', key: 'name', message: expect.stringContaining('invalid format') }),
    ]);
  });

  it('anchors the pattern so a partial match is not enough', () => {
    expect(errorsFor({ name: 'ok; rm -rf' })[0]?.key).toBe('name');
  });

  it('rejects an empty string as missing', () => {
    expect(errorsFor({ name: '' })[0]?.message).toContain('required');
  });

  it('rejects numbers outside min and max', () => {
    expect(errorsFor({ size: 0 })[0]).toMatchObject({ key: 'size', message: expect.stringContaining('at least 1') });
    expect(errorsFor({ size: 11 })[0]).toMatchObject({ key: 'size', message: expect.stringContaining('at most 10') });
  });

  it('rejects NaN and infinity', () => {
    expect(errorsFor({ size: Number.NaN })[0]?.key).toBe('size');
    expect(errorsFor({ size: Number.POSITIVE_INFINITY })[0]?.key).toBe('size');
  });

  it('rejects a select value that is not an option', () => {
    expect(errorsFor({ tier: 'huge' })[0]).toMatchObject({ key: 'tier', message: expect.stringContaining('small, large') });
  });

  it('rejects a value of the wrong type, as a hash link can carry one', () => {
    expect(errorsFor({ extra: 'yes' })[0]?.key).toBe('extra');
    expect(errorsFor({ size: '5' })[0]?.key).toBe('size');
  });

  it('reports every problem at once', () => {
    expect(errorsFor({ name: 'X', size: 99, tier: 'nope' }).map((error) => error.key)).toEqual(['name', 'size', 'tier']);
  });

  it('validates the shared context and marks the error with no item', () => {
    const errors = errorsFor({}, { project: 'Has Space', env: 'qa', namespace: 'ok' });
    expect(errors.map((error) => [error.itemId, error.key])).toEqual([
      [null, 'project'],
      [null, 'env'],
    ]);
  });

  it('reports an unknown item id', () => {
    const result = pick({ itemId: 'missing', values: {} });
    expect(result).toMatchObject({ ok: false, errors: [{ itemId: 'missing', key: null }] });
  });
});

describe('deploy.sh', () => {
  const script = ok(pick({ itemId: 'demo', values: {} }, { itemId: 'other', values: {} })).script;

  it('starts strict', () => {
    expect(script.startsWith('#!/usr/bin/env bash\nset -euo pipefail\n')).toBe(true);
  });

  it('writes each file through a quoted heredoc', () => {
    expect(script).toContain("cat > 'demo/main.tf' <<'INFRA_PICKER_EOF'\nname=alpha size=5 tier=small env=dev dir=demo\nINFRA_PICKER_EOF\n");
    expect(script).toContain("mkdir -p 'demo/nested'\ncat > 'demo/nested/deep.yaml' <<'INFRA_PICKER_EOF'\nproject: myapp\n");
  });

  it('runs commands under a header per item, after every file is written', () => {
    expect(script).toContain('# --- Demo item ---\necho apply demo in app\n');
    expect(script).toContain('# --- Other item ---\necho other\n');
    expect(script.lastIndexOf('cat >')).toBeLessThan(script.indexOf('# --- Demo item ---'));
  });

  it('passes bash -n', () => {
    expect(() => execFileSync('bash', ['-n'], { input: script })).not.toThrow();
  });

  it('recreates every file byte for byte when run, even with hostile content', () => {
    const hostile: CatalogItem = {
      ...other,
      id: 'hostile',
      files: [
        {
          path: 'a/b.sh',
          language: 'sh',
          template: "echo $HOME `id` $(whoami) 'quoted' \"double\" \\n\nINFRA_PICKER_EOF\nINFRA_PICKER_EOF_\nlast {{project}}",
        },
      ],
      commands: ['echo ran-{{dir}} >> ran.log', 'echo second >> ran.log'],
    };
    const bundle = ok(render([{ itemId: 'hostile', values: {} }], defaultContext, [hostile]));
    const dir = mkdtempSync(join(tmpdir(), 'armory-'));
    writeFileSync(join(dir, 'deploy.sh'), bundle.script);
    execFileSync('bash', ['deploy.sh'], { cwd: dir });
    for (const file of bundle.files) expect(readFileSync(join(dir, file.path), 'utf8')).toBe(file.content);
    expect(readFileSync(join(dir, 'ran.log'), 'utf8')).toBe('ran-hostile\nsecond\n');
  });
});
