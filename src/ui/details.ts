import type { Country } from '../types.js';

export function showDetail(country: Country): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', country.name);

  const title = document.createElement('h2');
  title.textContent = country.name;
  modal.append(title);

  modal.append(row('Capital', country.capital || '—'));
  modal.append(row('Region', country.region));
  modal.append(row('Population', country.population.toLocaleString()));
  modal.append(row('Area', `${country.area.toLocaleString()} km²`));
  modal.append(row('Borders', country.borders.length ? country.borders.join(', ') : 'None'));
  modal.append(row('Languages', country.languages.length ? country.languages.join(', ') : '—'));
  modal.append(
    row(
      'Currencies',
      country.currencies.length
        ? country.currencies.map((c) => `${c.name} (${c.symbol})`).join(', ')
        : '—',
    ),
  );

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', close);
  modal.append(closeBtn);

  backdrop.append(modal);
  document.body.append(backdrop);

  document.addEventListener('keydown', onKey);

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') close();
  }

  function close(): void {
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
  }
}

function row(label: string, value: string): HTMLElement {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = `${label}: `;
  p.append(strong, document.createTextNode(value));
  return p;
}
