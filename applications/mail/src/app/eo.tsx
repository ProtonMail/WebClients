import ReactDOM from 'react-dom';

import '@proton/polyfill';

import EOApp from './EOApp';
import './style';

ReactDOM.render(<EOApp />, document.querySelector('.app-root'));
