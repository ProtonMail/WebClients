import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import { App } from './App';
import { rewriteSessionlessJoinUrlToGuest } from './utils/rewriteSessionlessJoinUrlToGuest';

rewriteSessionlessJoinUrlToGuest();

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<App />);
