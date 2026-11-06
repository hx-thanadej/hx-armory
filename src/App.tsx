import { useEffect, useMemo, useReducer } from 'react';
import { catalog } from './catalog';
import { render } from './catalog/render';
import { ContextForm } from './components/ContextForm';
import { CatalogList } from './components/CatalogList';
import { ItemCard } from './components/ItemCard';
import { OutputPanel } from './components/OutputPanel';
import { encodeHash, parseHash } from './hash';
import { initialState, reducer } from './state';

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState, (base) => ({
    ...base,
    ...parseHash(location.hash, catalog),
  }));

  useEffect(() => {
    history.replaceState(null, '', `#${encodeHash(state, catalog)}`);
  }, [state.ctx, state.selected]);

  useEffect(() => {
    const onHashChange = () => dispatch({ type: 'load', shared: parseHash(location.hash, catalog) });
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const selectedItems = catalog.filter((item) => state.selected[item.id]);
  const selectedIds = useMemo(() => new Set(selectedItems.map((item) => item.id)), [state.selected]);
  const result = useMemo(
    () =>
      render(
        selectedItems.map((item) => ({ itemId: item.id, values: state.selected[item.id] ?? {} })),
        state.ctx,
        catalog,
      ),
    [state.ctx, state.selected],
  );
  const errors = result.ok ? [] : result.errors;

  return (
    <div className="app">
      <header className="top">
        <h1>Infra Picker</h1>
        <p className="hint">Tick what you need and copy the files and commands. Nothing is applied for you.</p>
      </header>
      <main className="layout">
        <CatalogList
          items={catalog}
          selectedIds={selectedIds}
          query={state.query}
          kind={state.kind}
          onQuery={(query) => dispatch({ type: 'setQuery', query })}
          onKind={(kind) => dispatch({ type: 'setKind', kind })}
          onToggle={(item) => dispatch({ type: 'toggle', item })}
        />
        <div className="middle">
          <ContextForm
            ctx={state.ctx}
            errors={errors}
            onChange={(key, value) => dispatch({ type: 'setContext', key, value })}
          />
          {selectedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              values={state.selected[item.id] ?? {}}
              errors={errors.filter((error) => error.itemId === item.id)}
              onChange={(key, value) => dispatch({ type: 'setParam', itemId: item.id, key, value })}
              onRemove={() => dispatch({ type: 'toggle', item })}
            />
          ))}
        </div>
        <OutputPanel
          result={result}
          anySelected={selectedItems.length > 0}
          activeFile={state.activeFile}
          onOpenFile={(path) => dispatch({ type: 'openFile', path })}
        />
      </main>
    </div>
  );
}
