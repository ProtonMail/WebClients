import ReactDOM from 'react-dom';

import '@proton/polyfill';

import App from './App';
import UrlsApp from './UrlsApp';
import './style';

const publicUrl = window.location.pathname.startsWith('/urls');
ReactDOM.render(publicUrl ? <UrlsApp /> : <App />, document.querySelector('.app-root'));
