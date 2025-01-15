/**
 * Entrypoint for the Private App
 */
import ReactDOM from 'react-dom';

import '@proton/polyfill';

import { initializePerformanceMetrics } from '../utils/performance';
import PhotosApp from './PhotosApp';
import './style';

initializePerformanceMetrics(false);

ReactDOM.render(<PhotosApp />, document.querySelector('.app-root'));
