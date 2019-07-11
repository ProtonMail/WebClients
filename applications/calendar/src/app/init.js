import ReactDOM from 'react-dom';
import React from 'react';
import { setConfig } from 'react-hot-loader';
import { createApp } from 'react-components';
import * as config from './config';

const AuthenticatedAppRoutes = React.lazy(() => import('./content/AuthenticatedAppRoutes'));
const UnAuthenticatedAppRoutes = React.lazy(() => import('./content/UnAuthenticatedAppRoutes'));

setConfig({
    ignoreSFC: true, // RHL will be __completely__ disabled for SFC
    pureRender: true // RHL will not change render method
});

export default () => {
    const App = createApp(config, AuthenticatedAppRoutes, UnAuthenticatedAppRoutes);
    ReactDOM.render(<App />, document.querySelector('.app-root'));
};
