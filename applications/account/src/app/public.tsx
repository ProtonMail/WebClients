import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import PublicApp from './content/PublicApp';
import './style';

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<PublicApp />);
