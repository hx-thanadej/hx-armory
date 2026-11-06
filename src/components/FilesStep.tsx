import type { Bundle, CatalogItem, Context } from '../catalog/types';
import { downloadText } from '../download';
import { CommandList } from './CommandList';
import { CopyButton } from './CopyButton';
import { FileBrowser } from './FileBrowser';
import { Icon } from './Icon';
import { StepFooter } from './StepFooter';

type Props = {
  bundle: Bundle;
  ctx: Context;
  selectedItems: readonly CatalogItem[];
  shareUrl: string;
  activeFile: string | null;
  onOpenFile: (path: string) => void;
  onBack: () => void;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function FilesStep({ bundle, ctx, selectedItems, shareUrl, activeFile, onOpenFile, onBack }: Props) {
  const commandCount = bundle.steps.reduce((sum, step) => sum + step.commands.length, 0);
  return (
    <>
      <section className="step-body" aria-labelledby="step-heading">
        <header className="step-intro">
          <h2 id="step-heading" tabIndex={-1}>
            Get your files
          </h2>
          <p className="lede">
            {plural(selectedItems.length, 'item')} for <strong>{ctx.project}</strong> in <strong>{ctx.env}</strong>, namespace{' '}
            <strong>{ctx.namespace}</strong>. That is {plural(bundle.files.length, 'file')} and {plural(commandCount, 'command')}.
          </p>
        </header>

        <div className="card card-hero">
          <div className="hero-text">
            <h3>One script does it all</h3>
            <p className="card-note">
              deploy.sh writes every file below and runs every command in order. Read it first, then run{' '}
              <code>bash deploy.sh</code> in your own shell. Nothing runs from this page.
            </p>
          </div>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary btn-large" onClick={() => downloadText('deploy.sh', bundle.script)}>
              <Icon name="download" />
              Download deploy.sh
            </button>
            <CopyButton text={bundle.script} label="Copy deploy.sh" className="btn btn-secondary btn-large" />
          </div>
        </div>

        {bundle.steps.length > 0 && (
          <section className="block" aria-labelledby="commands-title">
            <h3 id="commands-title">Run it in this order</h3>
            <p className="block-note">Prefer to go step by step? Write the files below first, then run these from the same folder.</p>
            <CommandList steps={bundle.steps} />
          </section>
        )}

        <section className="block" aria-labelledby="files-title">
          <h3 id="files-title">Files</h3>
          <FileBrowser files={bundle.files} activePath={activeFile} onOpen={onOpenFile} />
        </section>
      </section>

      <StepFooter>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <Icon name="back" />
          Back
        </button>
        <span className="footer-status" />
        <CopyButton text={shareUrl} label="Copy shareable link" className="btn btn-secondary" />
      </StepFooter>
    </>
  );
}
