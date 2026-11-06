import type { ParamValue } from './types';

// A TemplateError is a catalog authoring bug, never a user input problem, so it throws.
export class TemplateError extends Error {
  constructor(
    readonly item: string,
    readonly key: string,
    reason: string,
  ) {
    super(`Template for "${item}": ${reason} (key "${key}")`);
    this.name = 'TemplateError';
  }
}

type Node =
  | { kind: 'text'; text: string }
  | { kind: 'value'; key: string }
  | { kind: 'if'; key: string; body: Node[] };

type Tag =
  | { kind: 'value'; key: string }
  | { kind: 'open'; key: string }
  | { kind: 'close' };

const KEY = '[A-Za-z_][A-Za-z0-9_]*';
const VALUE_TAG = new RegExp(`^${KEY}$`);
const OPEN_TAG = new RegExp(`^#if\\s+(${KEY})$`);

function parseTag(inner: string, item: string): Tag {
  const text = inner.trim();
  if (text === '/if') return { kind: 'close' };
  const open = OPEN_TAG.exec(text);
  if (open) return { kind: 'open', key: open[1]! };
  if (VALUE_TAG.test(text)) return { kind: 'value', key: text };
  throw new TemplateError(item, text, 'malformed tag');
}

// A block tag alone on its line takes the whole line with it, so conditionals
// leave no blank lines behind in HCL or YAML.
function standaloneEnd(source: string, open: number, after: number): number | null {
  const lineStart = source.lastIndexOf('\n', open - 1) + 1;
  if (!/^[ \t]*$/.test(source.slice(lineStart, open))) return null;
  const rest = /^[ \t]*(\r?\n|$)/.exec(source.slice(after));
  return rest ? after + rest[0].length : null;
}

function parse(source: string, item: string): Node[] {
  const root: Node[] = [];
  const blocks: Extract<Node, { kind: 'if' }>[] = [];
  let current = root;
  let pos = 0;

  while (pos < source.length) {
    const open = source.indexOf('{{', pos);
    if (open === -1) {
      current.push({ kind: 'text', text: source.slice(pos) });
      break;
    }
    const close = source.indexOf('}}', open + 2);
    if (close === -1) throw new TemplateError(item, source.slice(open, open + 20), 'unterminated tag');

    const tag = parseTag(source.slice(open + 2, close), item);
    const after = close + 2;
    let textEnd = open;
    let next = after;

    if (tag.kind !== 'value') {
      const end = standaloneEnd(source, open, after);
      if (end !== null) {
        textEnd = source.lastIndexOf('\n', open - 1) + 1;
        next = end;
      }
    }
    if (textEnd > pos) current.push({ kind: 'text', text: source.slice(pos, textEnd) });

    if (tag.kind === 'value') {
      current.push({ kind: 'value', key: tag.key });
    } else if (tag.kind === 'open') {
      const block: Extract<Node, { kind: 'if' }> = { kind: 'if', key: tag.key, body: [] };
      current.push(block);
      blocks.push(block);
      current = block.body;
    } else {
      if (blocks.length === 0) throw new TemplateError(item, '/if', 'closing tag without an opening #if');
      blocks.pop();
      current = blocks.at(-1)?.body ?? root;
    }
    pos = next;
  }

  const unclosed = blocks.at(-1);
  if (unclosed) throw new TemplateError(item, unclosed.key, 'unclosed #if block');
  return root;
}

type Vars = Readonly<Record<string, ParamValue>>;

function lookup(vars: Vars, key: string, item: string): ParamValue {
  if (!Object.hasOwn(vars, key)) throw new TemplateError(item, key, 'unknown key');
  return vars[key]!;
}

function evaluate(nodes: readonly Node[], vars: Vars, item: string): string {
  let out = '';
  for (const node of nodes) {
    if (node.kind === 'text') {
      out += node.text;
    } else if (node.kind === 'value') {
      out += String(lookup(vars, node.key, item));
    } else {
      const flag = lookup(vars, node.key, item);
      if (typeof flag !== 'boolean') throw new TemplateError(item, node.key, '#if needs a boolean');
      // Rendered even when off, so a typo inside a disabled block still fails loudly.
      const body = evaluate(node.body, vars, item);
      if (flag) out += body;
    }
  }
  return out;
}

export function renderTemplate(source: string, vars: Vars, item: string): string {
  return evaluate(parse(source, item), vars, item);
}
