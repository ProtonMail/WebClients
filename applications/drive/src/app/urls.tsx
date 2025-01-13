/**
 * Entrypoint for the Public Urls App
 */
import ReactDOM from 'react-dom';

import '@proton/polyfill';

import UrlsApp from './UrlsApp';
import './style';
import { initializePerformanceMetrics } from './utils/performance';

initializePerformanceMetrics(true);

ReactDOM.render(<UrlsApp />, document.querySelector('.app-root'));
