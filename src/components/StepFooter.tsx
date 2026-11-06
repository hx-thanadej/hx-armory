import type { ReactNode } from 'react';

export function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="step-footer">
      <div className="step-footer-inner">{children}</div>
    </div>
  );
}
