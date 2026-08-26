import { createRoot } from 'react-dom/client';

import { install as installResizeObserver } from 'resize-observer';

import '@proton/polyfill';

import './0';
import App from './App';
import './style';

// This app targets older browsers than the rest of the monorepo (see the [verify]
// section in .browserslistrc), some of which lack ResizeObserver.
if (!window.ResizeObserver) {
    installResizeObserver();
}

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<App />);
