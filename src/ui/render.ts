import type { AppState } from '../app/state.js';
import type { Country } from '../types.js';

export interface RenderOptions {
  onCardClick: (country: Country) => void;
  onRetry: () => void;
}

export function render(root: HTMLElement, state: AppState, opts: RenderOptions): void {
  root.replaceChildren();

  switch (state.status) {
    case 'idle':
      return;
    case 'loading':
      root.append(renderLoading());
      return;
    case 'empty':
      root.append(renderEmpty());
      return;
    case 'error':
      root.append(renderError(state.error, opts.onRetry));
      return;
    case 'results':
      root.append(renderResults(state.items, opts.onCardClick));
      return;
  }
}

function renderLoading(): HTMLElement {
  const el = document.createElement('p');
  el.className = 'status loading';
  el.textContent = 'Searching…';
  return el;
}

function renderEmpty(): HTMLElement {
  const el = document.createElement('p');
  el.className = 'status empty';
  el.textContent = 'Nothing found. Try a different query.';
  return el;
}

function renderError(message: string, onRetry: () => void): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'status error';

  const p = document.createElement('p');
  p.textContent = message;
  wrapper.append(p);

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Retry';
  button.addEventListener('click', onRetry);
  wrapper.append(button);

  return wrapper;
}

function renderResults(
  items: readonly Country[],
  onCardClick: (country: Country) => void,
): HTMLElement {
  const list = document.createElement('ul');
  list.className = 'results';

  for (const country of items) {
    const li = document.createElement('li');
    li.className = 'card';
    li.tabIndex = 0;
    li.addEventListener('click', () => onCardClick(country));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCardClick(country);
      }
    });
    li.append(renderCardInner(country));
    list.append(li);
  }

  return list;
}

function renderCardInner(country: Country): DocumentFragment {
  const frag = document.createDocumentFragment();

  const img = document.createElement('img');
  img.src = country.flag;
  img.alt = `${country.name} flag`;
  img.loading = 'lazy';
  frag.append(img);

  const info = document.createElement('div');

  const name = document.createElement('strong');
  name.textContent = country.name;
  info.append(name);

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const parts = [country.capital || '—', country.region, country.population.toLocaleString()];
  meta.textContent = parts.join(' · ');
  info.append(meta);

  frag.append(info);
  return frag;
}
