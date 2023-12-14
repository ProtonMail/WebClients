import ReactDOM from 'react-dom';

import '@proton/polyfill';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';

import App from './App';

initElectronClassnames();
ReactDOM.render(<App />, document.querySelector('.app-root'));
