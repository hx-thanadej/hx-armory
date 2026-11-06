export type Kind = 'terraform' | 'helm' | 'manifest' | 'command';

export type ParamValue = string | number | boolean;
export type Values = Record<string, ParamValue>;

type ParamBase = { key: string; label: string; help?: string };

export type Param =
  | (ParamBase & { type: 'string'; default: string; pattern?: string })
  | (ParamBase & { type: 'number'; default: number; min?: number; max?: number })
  | (ParamBase & { type: 'boolean'; default: boolean })
  | (ParamBase & { type: 'select'; default: string; options: readonly string[] });

export type FileTemplate = {
  path: string;
  language: 'hcl' | 'yaml' | 'sh' | 'json';
  template: string;
};

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  kind: Kind;
  category: string;
  params: readonly Param[];
  files: readonly FileTemplate[];
  commands: readonly string[];
};

// Shared by every selected item and available to templates as {{project}}, {{env}}, {{namespace}}.
// {{dir}} is the item's output directory (its id) and is added by the renderer.
export type Context = { project: string; env: string; namespace: string };

export type Selection = { itemId: string; values: Values };

export type OutFile = { path: string; language: FileTemplate['language']; content: string };

export type Bundle = {
  files: readonly OutFile[];
  steps: readonly { itemId: string; title: string; commands: readonly string[] }[];
  script: string;
};
