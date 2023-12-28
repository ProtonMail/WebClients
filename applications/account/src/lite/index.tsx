import ReactDOM from 'react-dom';

import '@proton/polyfill';

import './01-style';
import LiteApp from './LiteApp';

ReactDOM.render(<LiteApp />, document.querySelector('.app-root'));
