/**
 * Entrypoint for the Private App
 */
import { createRoot } from 'react-dom/client';

import { initDriveWebVitalsReporting } from '@proton/drive/modules/metrics';
import '@proton/polyfill';

import App from './App';
import './style';

initDriveWebVitalsReporting(false);
const container = document.querySelector('.app-root');
// Starting React 18 createRoot requires a non-null Element; the React docs recommend this pattern since .app-root is always present in the HTML template
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(container!).render(<App />);
