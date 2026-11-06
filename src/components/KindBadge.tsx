import type { Kind } from '../catalog/types';

export const kindLabel: Record<Kind, string> = {
  terraform: 'Terraform',
  helm: 'Helm',
  manifest: 'YAML',
  command: 'Command',
};

export function KindBadge({ kind }: { kind: Kind }) {
  return <span className={`badge kind-${kind}`}>{kindLabel[kind]}</span>;
}
