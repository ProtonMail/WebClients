import { ProtonApp, StandardSetup } from '@proton/components';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import sentry from '@proton/shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './content/PrivateApp';

import './app.scss';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.2',
    ...config,
};

sentry(enhancedConfig);

const App = () => {
    return (
        <ProtonApp config={enhancedConfig}>
            <StandardSetup PrivateApp={PrivateApp} locales={locales} />
        </ProtonApp>
    );
};

export default App;
