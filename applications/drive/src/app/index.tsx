/**
 * Entrypoint for the Private App
 */
import ReactDOM from 'react-dom';

import '@proton/polyfill';

import App from './App';
import './style';
import { initializePerformanceMetrics } from './utils/performance';

initializePerformanceMetrics(false);

ReactDOM.render(<App />, document.querySelector('.app-root'));
