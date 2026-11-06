import { useEffect, useState } from 'react';
import { copyText } from '../download';

type Status = 'idle' | 'copied' | 'failed';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 1500);
    return () => clearTimeout(timer);
  }, [status]);

  const onClick = async () => setStatus((await copyText(text)) ? 'copied' : 'failed');

  return (
    <button type="button" className="btn" onClick={onClick}>
      {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : label}
    </button>
  );
}
