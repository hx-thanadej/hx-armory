import { describe, expect, it } from 'vitest';
import { defaultContext } from '../context';
import { catalog } from '../index';
import { render } from '../render';
import { defaultValues } from '../validate';
import { helmKong } from './helm-kong';

const bundleFor = (values: Record<string, string | number | boolean> = {}) => {
  const result = render([{ itemId: helmKong.id, values: { ...defaultValues(helmKong.params), ...values } }], defaultContext, catalog);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.bundle;
};

describe('helm-kong', () => {
  it.each(['LoadBalancer', 'ClusterIP'])('keeps the Admin API on a ClusterIP Service with a %s proxy', (proxy_type) => {
    const values = bundleFor({ proxy_type }).files[0]?.content ?? '';
    expect(values).toContain(`proxy:\n    type: ${proxy_type}\n`);
    expect(values).toContain('admin:\n    type: ClusterIP\n');
    expect(values).toContain('manager:\n    enabled: false\n');
  });

  it('follows the controller and metrics switches', () => {
    expect(bundleFor().files[0]?.content).toContain('controller:\n  enabled: true\n');
    const off = bundleFor({ controller: false, metrics: true }).files[0]?.content ?? '';
    expect(off).toContain('controller:\n  enabled: false\n');
    expect(off).toContain('serviceMonitor:\n    enabled: true\n');
  });

  it('installs a pinned chart version under the chosen release name', () => {
    const install = bundleFor({ release: 'edge-kong' }).steps[0]?.commands.at(-1) ?? '';
    expect(install).toMatch(/^helm upgrade --install edge-kong kong\/ingress --version \d+\.\d+\.\d+ /);
  });
});
