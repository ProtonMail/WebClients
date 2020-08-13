import React from 'react';
import sentry from 'proton-shared/lib/helpers/sentry';
import { ProtonApp } from 'react-components';

import * as config from './config';
import Setup from './Setup';

import './app.scss';

sentry(config);

const App = () => {
    return (
        <ProtonApp config={config}>
            <Setup />
        </ProtonApp>
    );
};

export default App;
