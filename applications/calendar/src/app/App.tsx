import React from 'react';
import { ProtonApp, StandardSetup } from 'react-components';
import locales from 'proton-shared/lib/i18n/locales';
import sentry from 'proton-shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './content/PrivateApp';

import './app.scss';

sentry(config);

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.0-beta.16',
    ...config,
};

const App = () => {
    return (
        <ProtonApp config={enhancedConfig}>
            <StandardSetup PrivateApp={PrivateApp} locales={locales} />
        </ProtonApp>
    );
};

export default App;
