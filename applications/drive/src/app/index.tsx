import ReactDOM from 'react-dom';

import '@proton/polyfill';

import App from './App';
import UrlsApp from './UrlsApp';
import './style';
import { initializePerformanceMetrics } from './utils/performance';

const isPublicUrl = window.location.pathname.startsWith('/urls');

initializePerformanceMetrics(isPublicUrl);

ReactDOM.render(isPublicUrl ? <UrlsApp /> : <App />, document.querySelector('.app-root'));
