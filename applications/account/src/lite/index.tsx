import ReactDOM from 'react-dom';

import '@proton/polyfill';

import './AppA';
import App from './AppB';

ReactDOM.render(<App />, document.querySelector('.app-root'));
