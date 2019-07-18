import ReactDOM from 'react-dom';
import React from 'react';
import '@babel/polyfill';
import 'yetch/polyfill';

import App from './App';

ReactDOM.render(<App />, document.querySelector('.app-root'));
