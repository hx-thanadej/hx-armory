import { describe, expect, it } from 'vitest';
import { catalog } from './catalog';
import { encodeHash, parseHash } from './hash';
import { initialState } from './state';
import { isReachable, resolveStep, stepFromHash, withStep } from './steps';
import { requiredTools } from './tools';

const empty = { selectedCount: 0, errorCount: 0 };
const ready = { selectedCount: 2, errorCount: 0 };
const broken = { selectedCount: 2, errorCount: 1 };

describe('step reachability', () => {
  it('only allows picking while nothing is ticked', () => {
    expect([isReachable('pick', empty), isReachable('configure', empty), isReachable('files', empty)]).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('allows configuring but blocks the files while a field is invalid', () => {
    expect(isReachable('configure', broken)).toBe(true);
    expect(isReachable('files', broken)).toBe(false);
  });

  it('allows every step once something is ticked and valid', () => {
    expect(isReachable('files', ready)).toBe(true);
  });

  it('falls back to the furthest allowed step', () => {
    expect(resolveStep('files', broken)).toBe('configure');
    expect(resolveStep('files', empty)).toBe('pick');
    expect(resolveStep('configure', ready)).toBe('configure');
  });
});

describe('step in the URL hash', () => {
  it('starts on pick for a fresh visit and on the files for a shared selection', () => {
    expect(stepFromHash('', 0)).toBe('pick');
    expect(stepFromHash('#i=aws-s3-bucket', 1)).toBe('files');
  });

  it('keeps the step across a reload', () => {
    expect(stepFromHash(`#${withStep('i=aws-s3-bucket', 'configure')}`, 1)).toBe('configure');
  });

  it('ignores a step value it does not know', () => {
    expect(stepFromHash('#step=deploy', 0)).toBe('pick');
  });

  it('does not disturb the selection keys an old link carries', () => {
    const old = encodeHash({ ctx: initialState.ctx, selected: { 'helm-redis': { release: 'cache' } } }, catalog);
    expect(parseHash(`#${withStep(old, 'configure')}`, catalog)).toEqual(parseHash(`#${old}`, catalog));
  });
});

describe('required tools', () => {
  const tools = (id: string) => requiredTools(catalog.find((item) => item.id === id)!);

  it('names the programs an item runs once each', () => {
    expect(tools('aws-s3-bucket')).toEqual(['terraform']);
    expect(tools('helm-clickhouse')).toEqual(['helm', 'kubectl']);
  });

  it('leaves out shell basics used inside a pipeline', () => {
    expect(tools('helm-argo-cd')).toEqual(['helm', 'kubectl']);
  });
});
