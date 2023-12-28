import ReactDOM from 'react-dom';

import '@proton/polyfill';

import PublicApp from './content/PublicApp';
import './style';

ReactDOM.render(<PublicApp />, document.querySelector('.app-root'));
