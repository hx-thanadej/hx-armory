import type { OutFile } from '../catalog/types';
import { downloadText } from '../download';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

type Props = { files: readonly OutFile[]; activePath: string | null; onOpen: (path: string) => void };

const basename = (path: string) => path.slice(path.lastIndexOf('/') + 1);
const splitDir = (path: string) => {
  const slash = path.indexOf('/');
  return { dir: path.slice(0, slash), rest: path.slice(slash + 1) };
};

function byDirectory(files: readonly OutFile[]) {
  const dirs = new Map<string, OutFile[]>();
  for (const file of files) {
    const { dir } = splitDir(file.path);
    dirs.set(dir, [...(dirs.get(dir) ?? []), file]);
  }
  return [...dirs];
}

export function FileBrowser({ files, activePath, onOpen }: Props) {
  const current = files.find((file) => file.path === activePath) ?? files[0];
  if (!current) return <p className="card-note">These items only run commands, so there are no files.</p>;
  const dirs = byDirectory(files);

  return (
    <div className="file-browser">
      <nav className="file-tree" aria-label="Files">
        {dirs.map(([dir, entries]) => (
          <div key={dir} className="tree-dir">
            <span className="tree-dir-name">
              <Icon name="folder" size={16} />
              {dir}/
            </span>
            <ul>
              {entries.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    className="tree-file"
                    aria-current={file === current ? 'true' : undefined}
                    onClick={() => onOpen(file.path)}
                  >
                    <Icon name="file" size={16} />
                    {splitDir(file.path).rest}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <label className="file-picker">
        <span className="visually-hidden">Choose a file</span>
        <select value={current.path} onChange={(e) => onOpen(e.target.value)}>
          {dirs.map(([dir, entries]) => (
            <optgroup key={dir} label={`${dir}/`}>
              {entries.map((file) => (
                <option key={file.path} value={file.path}>
                  {file.path}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="code-view">
        <div className="code-head">
          <span className="code-path">{current.path}</span>
          <span className="code-actions">
            <CopyButton text={current.content} className="btn btn-small" describe={current.path} />
            <button type="button" className="btn btn-small" onClick={() => downloadText(basename(current.path), current.content)}>
              <Icon name="download" />
              Download<span className="visually-hidden"> {current.path}</span>
            </button>
          </span>
        </div>
        <pre className="code" tabIndex={0} aria-label={`Contents of ${current.path}`}>
          <code>{current.content}</code>
        </pre>
      </div>
    </div>
  );
}
