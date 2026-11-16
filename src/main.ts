import { createApp, type AppState } from './app/state.js';
import { render } from './ui/render.js';
import { showDetail } from './ui/detail.js';

const input = document.createElement('input');
input.type = 'search';
input.placeholder = 'Search countries…';
input.setAttribute('aria-label', 'Country search');

const statusArea = document.createElement('section');
statusArea.className = 'status-area';
statusArea.setAttribute('aria-live', 'polite');

const app = createApp((state: AppState) => {
  render(statusArea, state, {
    onCardClick: showDetail,
    onRetry: () => app.retry(),
  });
});

input.addEventListener('input', () => {
  app.onInput(input.value);
});

document.body.append(input, statusArea);
