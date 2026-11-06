import { useEffect, useMemo, useReducer, useRef } from 'react';
import { catalog } from './catalog';
import { render } from './catalog/render';
import { ConfigureStep } from './components/ConfigureStep';
import { FilesStep } from './components/FilesStep';
import { PickStep } from './components/PickStep';
import { Stepper } from './components/Stepper';
import { encodeHash, parseHash } from './hash';
import { initialState, reducer } from './state';
import { resolveStep, stepFromHash, withStep, type Step } from './steps';

const exampleIds = ['aws-s3-bucket', 'helm-redis'];

function loadFromHash() {
  const shared = parseHash(location.hash, catalog);
  return { shared, step: stepFromHash(location.hash, Object.keys(shared.selected).length) };
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState, (base) => {
    const { shared, step } = loadFromHash();
    return { ...base, ...shared, step };
  });

  const selectedItems = catalog.filter((item) => state.selected[item.id]);
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
  const progress = { selectedCount: selectedItems.length, errorCount: errors.length };
  const step = resolveStep(state.step, progress);
  const sharedHash = encodeHash(state, catalog);

  useEffect(() => {
    history.replaceState(null, '', `#${withStep(sharedHash, step)}`);
  }, [sharedHash, step]);

  useEffect(() => {
    const onHashChange = () => {
      const { shared, step: next } = loadFromHash();
      dispatch({ type: 'load', shared });
      dispatch({ type: 'goTo', step: next });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Keep the stored step in line with what is shown, so fixing a field never jumps ahead on its own.
  useEffect(() => {
    if (state.step !== step) dispatch({ type: 'goTo', step });
  }, [state.step, step]);

  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    window.scrollTo({ top: 0 });
    document.getElementById('step-heading')?.focus({ preventScroll: true });
  }, [step]);

  const goTo = (next: Step) => dispatch({ type: 'goTo', step: next });
  const toggle = (item: (typeof catalog)[number]) => dispatch({ type: 'toggle', item });
  const tryExample = () => {
    for (const item of catalog) if (exampleIds.includes(item.id) && !state.selected[item.id]) toggle(item);
  };
  const shareUrl = `${location.origin}${location.pathname}#${sharedHash}`;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">A</span>
            <span className="brand-name">Armory</span>
          </span>
          <Stepper current={step} progress={progress} onGo={goTo} />
        </div>
      </header>

      <main className={`main main-${step}`}>
        {step === 'pick' && (
          <PickStep
            items={catalog}
            selectedItems={selectedItems}
            query={state.query}
            kind={state.kind}
            onQuery={(query) => dispatch({ type: 'setQuery', query })}
            onKind={(kind) => dispatch({ type: 'setKind', kind })}
            onToggle={toggle}
            onExample={tryExample}
            onContinue={() => goTo('configure')}
          />
        )}
        {step === 'configure' && (
          <ConfigureStep
            ctx={state.ctx}
            selectedItems={selectedItems}
            selected={state.selected}
            errors={errors}
            onContext={(key, value) => dispatch({ type: 'setContext', key, value })}
            onParam={(itemId, key, value) => dispatch({ type: 'setParam', itemId, key, value })}
            onRemove={toggle}
            onBack={() => goTo('pick')}
            onContinue={() => goTo('files')}
          />
        )}
        {step === 'files' && result.ok && (
          <FilesStep
            bundle={result.bundle}
            ctx={state.ctx}
            selectedItems={selectedItems}
            shareUrl={shareUrl}
            activeFile={state.activeFile}
            onOpenFile={(path) => dispatch({ type: 'openFile', path })}
            onBack={() => goTo('configure')}
          />
        )}
      </main>
    </div>
  );
}
