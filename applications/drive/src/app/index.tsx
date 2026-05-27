/**
 * Entrypoint for the Private App
 */
import ReactDOM from 'react-dom';

import { initDriveWebVitalsReporting } from '@proton/drive/modules/metrics';
import '@proton/polyfill';

import App from './App';
import './style';

initDriveWebVitalsReporting(false);

ReactDOM.render(<App />, document.querySelector('.app-root'));
