import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import './01-style';
import LiteApp from './LiteApp';

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<LiteApp />);
