import { createRoot } from 'react-dom/client';

import '@proton/polyfill';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';

import { App } from './App';
import './style';

initSafariFontFixClassnames();

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<App />);
