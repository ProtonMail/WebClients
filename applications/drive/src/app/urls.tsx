/**
 * Entrypoint for the Public Urls App
 */
import ReactDOM from 'react-dom';

import '@proton/polyfill';

import UrlsApp from './UrlsApp';
import { initDriveWebVitalsReporting } from './modules/metrics/webVitals';
import './style';

initDriveWebVitalsReporting(true);

ReactDOM.render(<UrlsApp />, document.querySelector('.app-root'));
