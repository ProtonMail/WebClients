import ReactDOM from 'react-dom';

import '@proton/polyfill';
import { reportWebVitals } from '@proton/shared/lib/metrics/webvitals';

import App from './App';
import UrlsApp from './UrlsApp';
import './style';

const publicUrl = window.location.pathname.startsWith('/urls');

reportWebVitals(publicUrl ? 'public' : 'private');

ReactDOM.render(publicUrl ? <UrlsApp /> : <App />, document.querySelector('.app-root'));
