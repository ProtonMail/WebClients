/**
 * Entrypoint for the Public Urls App
 */
import ReactDOM from 'react-dom';

import { initDriveWebVitalsReporting } from '@proton/drive/modules/metrics';
import '@proton/polyfill';

import UrlsApp from './UrlsApp';
import './style';

initDriveWebVitalsReporting(true);

ReactDOM.render(<UrlsApp />, document.querySelector('.app-root'));
