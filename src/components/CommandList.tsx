import type { Bundle } from '../catalog/types';
import { CopyButton } from './CopyButton';

export function CommandList({ steps }: { steps: Bundle['steps'] }) {
  let number = 0;
  return (
    <div className="command-groups">
      {steps.map((step) => (
        <section key={step.itemId} className="command-group" aria-label={step.title}>
          <h4>{step.title}</h4>
          <ol className="commands">
            {step.commands.map((command) => {
              number += 1;
              return (
                <li key={command} className="command">
                  <span className="command-number" aria-hidden="true">
                    {number}
                  </span>
                  <code className="command-text">{command}</code>
                  <CopyButton text={command} className="btn btn-small" describe={`command ${number}`} />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
