import { useEffect, useState } from 'react';
import { copyText } from '../download';
import { Icon } from './Icon';

type Status = 'idle' | 'copied' | 'failed';

type Props = { text: string; label?: string; describe?: string; className?: string };

export function CopyButton({ text, label = 'Copy', describe, className = 'btn btn-secondary' }: Props) {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 1500);
    return () => clearTimeout(timer);
  }, [status]);

  const onClick = async () => setStatus((await copyText(text)) ? 'copied' : 'failed');

  return (
    <button type="button" className={className} data-status={status} onClick={onClick}>
      <Icon name={status === 'copied' ? 'check' : 'copy'} />
      <span aria-live="polite">{status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : label}</span>
      {describe && status === 'idle' && <span className="visually-hidden"> {describe}</span>}
    </button>
  );
}
