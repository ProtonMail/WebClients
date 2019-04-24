import ReactDOM from 'react-dom';
import React from 'react';
import { setConfig } from 'react-hot-loader';

import createApp from './App';

setConfig({
    ignoreSFC: true, // RHL will be __completely__ disabled for SFC
    pureRender: true // RHL will not change render method
});

export default () => {
    const App = createApp();
    ReactDOM.render(<App />, document.querySelector('.app-root'));
};
