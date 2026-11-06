import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import PrivateApp from './PrivateApp';
import './style';

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<PrivateApp />);
