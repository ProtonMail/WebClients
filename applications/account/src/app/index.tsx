import ReactDOM from 'react-dom';
import React from 'react';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'yetch/polyfill';

import App from './App';

ReactDOM.render(<App />, document.querySelector('.app-root'));
