/**
 * Entrypoint for the Private App
 */
import ReactDOM from 'react-dom';

import '@proton/polyfill';

import PhotosApp from './PhotosApp';
import './style';
import { initializePerformanceMetrics } from './utils/performance';

initializePerformanceMetrics(false);

ReactDOM.render(<PhotosApp />, document.querySelector('.app-root'));
