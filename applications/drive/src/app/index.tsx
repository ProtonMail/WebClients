import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import App from './App';
import UrlsApp from './UrlsApp';
import './style';

const publicUrl = window.location.pathname.startsWith('/urls');
const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(publicUrl ? <UrlsApp /> : <App />);
