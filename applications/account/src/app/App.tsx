import React from 'react';
import sentry from 'proton-shared/lib/helpers/sentry';
import { ProtonApp, ErrorBoundary, StandardErrorPage } from 'react-components';

import * as config from './config';
import Setup from './Setup';

import './app.scss';

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.0-beta.15',
    ...config,
};

sentry(enhancedConfig);

const App = () => {
    return (
        <ProtonApp config={enhancedConfig}>
            <ErrorBoundary component={<StandardErrorPage />}>
                <Setup />
            </ErrorBoundary>
        </ProtonApp>
    );
};

export default App;
