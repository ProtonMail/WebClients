import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import EOApp from './EOApp';
import './style';

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<EOApp />);
