import { defaultContext } from './catalog/context';
import type { CatalogItem, Context, Kind, ParamValue, Values } from './catalog/types';
import { defaultValues } from './catalog/validate';

export type Shared = { ctx: Context; selected: Readonly<Record<string, Values>> };
export type KindFilter = Kind | 'all';

export type State = Shared & {
  query: string;
  kind: KindFilter;
  activeFile: string | null;
};

export type Action =
  | { type: 'toggle'; item: CatalogItem }
  | { type: 'setParam'; itemId: string; key: string; value: ParamValue }
  | { type: 'setContext'; key: keyof Context; value: string }
  | { type: 'setQuery'; query: string }
  | { type: 'setKind'; kind: KindFilter }
  | { type: 'openFile'; path: string }
  | { type: 'load'; shared: Shared };

export const initialState: State = {
  ctx: defaultContext,
  selected: {},
  query: '',
  kind: 'all',
  activeFile: null,
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'toggle': {
      const { [action.item.id]: removed, ...rest } = state.selected;
      return { ...state, selected: removed ? rest : { ...state.selected, [action.item.id]: defaultValues(action.item.params) } };
    }
    case 'setParam': {
      const current = state.selected[action.itemId];
      if (!current) return state;
      return { ...state, selected: { ...state.selected, [action.itemId]: { ...current, [action.key]: action.value } } };
    }
    case 'setContext':
      return { ...state, ctx: { ...state.ctx, [action.key]: action.value } };
    case 'setQuery':
      return { ...state, query: action.query };
    case 'setKind':
      return { ...state, kind: action.kind };
    case 'openFile':
      return { ...state, activeFile: action.path };
    case 'load':
      return { ...state, ...action.shared };
  }
}
