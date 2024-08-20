import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import App from './App';
import './style';

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<App />);
