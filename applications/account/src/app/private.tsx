import ReactDOM from 'react-dom';

import '@proton/polyfill';

import PrivateApp from './content/PrivateApp';
import './style';

ReactDOM.render(<PrivateApp />, document.querySelector('.app-root'));
