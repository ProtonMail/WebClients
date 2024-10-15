import { createRoot } from 'react-dom/client';

import '@proton/polyfill';

import App from './App';
import { initializePerformanceMetrics } from './helpers/metrics/initializePerformanceMetrics';
import './style';

initializePerformanceMetrics();

const container = document.querySelector('.app-root');
const root = createRoot(container!);
root.render(<App />);
