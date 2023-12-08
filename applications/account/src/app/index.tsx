import ReactDOM from 'react-dom';

import '@proton/polyfill';
import { isElectronApp, isElectronOnMac, isElectronOnWindows } from '@proton/shared/lib/helpers/desktop';

import App from './App';

if (isElectronApp()) {
    document.body.classList.add('is-electron');
}

if (isElectronOnMac()) {
    document.body.classList.add('is-electron-mac');
}

if (isElectronOnWindows()) {
    document.body.classList.add('is-electron-windows');
}

ReactDOM.render(<App />, document.querySelector('.app-root'));
