import type { CatalogItem } from './catalog/types';

// Programs any shell already has. Listing them as requirements would only add noise.
const shellBasics = new Set(['echo', 'printf', 'base64', 'cat', 'grep', 'sed', 'awk', 'tr', 'xargs', 'cd', 'export', 'sleep', 'test', 'true']);

export function requiredTools(item: CatalogItem): string[] {
  const tools = new Set<string>();
  for (const command of item.commands) {
    for (const segment of command.split(/\|\|?|&&|;/)) {
      const program = segment.trim().split(/\s+/)[0]?.replace(/[()]/g, '');
      if (program && !shellBasics.has(program)) tools.add(program);
    }
  }
  return [...tools];
}
