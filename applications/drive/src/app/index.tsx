/**
 * Entrypoint for the Private App
 */
import ReactDOM from 'react-dom';

import '@proton/polyfill';

import App from './App';
import { initDriveWebVitalsReporting } from './modules/metrics/webVitals';
import './style';

initDriveWebVitalsReporting(false);

ReactDOM.render(<App />, document.querySelector('.app-root'));
