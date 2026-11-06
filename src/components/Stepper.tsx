import { isReachable, stepLabel, steps, type Progress, type Step } from '../steps';
import { Icon } from './Icon';

type Props = { current: Step; progress: Progress; onGo: (step: Step) => void };

export function Stepper({ current, progress, onGo }: Props) {
  const currentIndex = steps.indexOf(current);
  return (
    <nav className="stepper" aria-label="Progress">
      <ol>
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const reachable = isReachable(step, progress);
          return (
            <li key={step} className="stepper-item" data-state={step === current ? 'current' : done ? 'done' : 'todo'}>
              <button
                type="button"
                className="stepper-button"
                aria-current={step === current ? 'step' : undefined}
                disabled={!reachable}
                onClick={() => onGo(step)}
              >
                <span className="stepper-dot">{done ? <Icon name="check" size={14} /> : index + 1}</span>
                <span className="stepper-label">{stepLabel[step]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
