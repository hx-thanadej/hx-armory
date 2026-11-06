export const steps = ['pick', 'configure', 'files'] as const;
export type Step = (typeof steps)[number];

export const stepLabel: Record<Step, string> = {
  pick: 'Pick',
  configure: 'Configure',
  files: 'Get your files',
};

export type Progress = { selectedCount: number; errorCount: number };

export function isReachable(step: Step, { selectedCount, errorCount }: Progress): boolean {
  switch (step) {
    case 'pick':
      return true;
    case 'configure':
      return selectedCount > 0;
    case 'files':
      return selectedCount > 0 && errorCount === 0;
  }
}

// A requested step the state no longer allows falls back to the furthest one before it that is allowed.
export function resolveStep(requested: Step, progress: Progress): Step {
  for (let index = steps.indexOf(requested); index > 0; index--) {
    if (isReachable(steps[index]!, progress)) return steps[index]!;
  }
  return 'pick';
}

const isStep = (value: string | null): value is Step => steps.includes(value as Step);

// No step key means a fresh visit or a shared link, and a shared link should open on the result.
export function stepFromHash(hash: string, selectedCount: number): Step {
  const raw = new URLSearchParams(hash.replace(/^#/, '')).get('step');
  if (isStep(raw)) return raw;
  return selectedCount > 0 ? 'files' : 'pick';
}

export function withStep(encoded: string, step: Step): string {
  const params = new URLSearchParams(encoded);
  params.set('step', step);
  return params.toString();
}
