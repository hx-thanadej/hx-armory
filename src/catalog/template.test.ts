import { describe, expect, it } from 'vitest';
import { renderTemplate, TemplateError } from './template';

const vars = { project: 'shop', replicas: 3, on: true, off: false };
const run = (source: string) => renderTemplate(source, vars, 'demo-item');

describe('substitution', () => {
  it('fills strings, numbers and booleans', () => {
    expect(run('{{project}} x{{replicas}} {{on}}')).toBe('shop x3 true');
  });

  it('tolerates spaces inside the braces', () => {
    expect(run('{{ project }}')).toBe('shop');
  });

  it('leaves surrounding text such as shell and HCL interpolation untouched', () => {
    expect(run('echo "${HOME}" ${var.x} {{project}}')).toBe('echo "${HOME}" ${var.x} shop');
  });
});

describe('#if blocks', () => {
  it('includes the body when the flag is true', () => {
    expect(run('a{{#if on}}B{{/if}}c')).toBe('aBc');
  });

  it('drops the body when the flag is false', () => {
    expect(run('a{{#if off}}B{{/if}}c')).toBe('ac');
  });

  it('nests', () => {
    expect(run('{{#if on}}1{{#if off}}2{{/if}}3{{/if}}')).toBe('13');
  });

  it('removes a block tag that sits alone on its line', () => {
    const template = 'a\n{{#if on}}\nb\n{{/if}}\nc\n';
    expect(run(template)).toBe('a\nb\nc\n');
    expect(run(template.replace('on', 'off'))).toBe('a\nc\n');
  });

  it('removes indentation in front of a standalone tag', () => {
    expect(run('a\n  {{#if on}}\n  b\n  {{/if}}\nc')).toBe('a\n  b\nc');
  });

  it('keeps the newline when the tag shares its line with text', () => {
    expect(run('a {{#if on}}b{{/if}}\nc')).toBe('a b\nc');
  });
});

describe('errors', () => {
  const failure = (source: string) => {
    try {
      run(source);
    } catch (error) {
      return error;
    }
    throw new Error('expected a TemplateError');
  };

  it('names the item and the key for an unknown key', () => {
    const error = failure('hello {{nope}}');
    expect(error).toBeInstanceOf(TemplateError);
    expect(error).toMatchObject({ item: 'demo-item', key: 'nope' });
    expect((error as Error).message).toContain('demo-item');
    expect((error as Error).message).toContain('nope');
  });

  it('rejects an unknown key inside a disabled block', () => {
    expect(failure('{{#if off}}{{typo}}{{/if}}')).toMatchObject({ key: 'typo' });
  });

  it('rejects an unknown key in an #if condition', () => {
    expect(failure('{{#if missing}}x{{/if}}')).toMatchObject({ key: 'missing' });
  });

  it('rejects #if on a value that is not a boolean', () => {
    expect(failure('{{#if project}}x{{/if}}')).toMatchObject({ key: 'project' });
  });

  it('rejects an unclosed block', () => {
    expect(failure('{{#if on}}x')).toBeInstanceOf(TemplateError);
  });

  it('rejects a stray closing tag', () => {
    expect(failure('x{{/if}}')).toBeInstanceOf(TemplateError);
  });

  it('rejects malformed and unterminated tags instead of printing them', () => {
    expect(failure('{{pro ject}}')).toBeInstanceOf(TemplateError);
    expect(failure('{{project')).toBeInstanceOf(TemplateError);
  });

  it('does not treat inherited object keys as values', () => {
    expect(failure('{{toString}}')).toMatchObject({ key: 'toString' });
  });
});
