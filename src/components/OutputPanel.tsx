import type { RenderResult } from '../catalog/render';
import { downloadText } from '../download';
import { CopyButton } from './CopyButton';

type Props = {
  result: RenderResult;
  anySelected: boolean;
  activeFile: string | null;
  onOpenFile: (path: string) => void;
};

const basename = (path: string) => path.slice(path.lastIndexOf('/') + 1);

export function OutputPanel({ result, anySelected, activeFile, onOpenFile }: Props) {
  if (!anySelected) {
    return (
      <section className="panel" aria-labelledby="output-title">
        <h2 id="output-title">Output</h2>
        <p className="hint">Tick an item in the catalog. Its files and commands appear here.</p>
      </section>
    );
  }
  if (!result.ok) {
    return (
      <section className="panel" aria-labelledby="output-title">
        <h2 id="output-title">Output</h2>
        <p className="error" role="alert">
          Fix {result.errors.length} {result.errors.length === 1 ? 'field' : 'fields'} to see the output.
        </p>
      </section>
    );
  }

  const { files, steps, script } = result.bundle;
  const current = files.find((file) => file.path === activeFile) ?? files[0];
  const allCommands = steps.map((step) => step.commands.join('\n')).join('\n');

  return (
    <section className="panel output" aria-labelledby="output-title">
      <h2 id="output-title">Output</h2>
      <p className="hint">Nothing here runs by itself. Read it, then run it in your own shell.</p>

      {current && (
        <>
          <div className="tabs" role="tablist" aria-label="Files">
            {files.map((file) => (
              <button
                key={file.path}
                type="button"
                role="tab"
                aria-selected={file === current}
                className="tab"
                onClick={() => onOpenFile(file.path)}
              >
                {file.path}
              </button>
            ))}
          </div>
          <div className="toolbar">
            <span className="hint">{current.language}</span>
            <CopyButton text={current.content} />
            <button type="button" className="btn" onClick={() => downloadText(basename(current.path), current.content)}>
              Download
            </button>
          </div>
          <pre className="code" role="tabpanel" aria-label={current.path}>
            <code>{current.content}</code>
          </pre>
        </>
      )}

      <div className="toolbar">
        <h3>Commands</h3>
        {allCommands && <CopyButton text={allCommands} label="Copy all" />}
      </div>
      <ol className="steps">
        {steps.map((step) => (
          <li key={step.itemId}>
            <strong>{step.title}</strong>
            {step.commands.map((command) => (
              <div key={command} className="command">
                <code>{command}</code>
                <CopyButton text={command} />
              </div>
            ))}
          </li>
        ))}
      </ol>

      <button type="button" className="btn btn-primary" onClick={() => downloadText('deploy.sh', script)}>
        Download deploy.sh
      </button>
    </section>
  );
}
