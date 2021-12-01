import sentry from '@proton/shared/lib/helpers/sentry';
import { ProtonApp, ErrorBoundary, StandardErrorPage } from '@proton/components';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { APPS } from '@proton/shared/lib/constants';

import * as config from '../app/config';
import '../app/app.scss';
import Setup from './Setup';

initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.0',
    ...config,
    APP_NAME: APPS.PROTONACCOUNTLITE,
};

sentry(enhancedConfig);

const App = () => {
    return (
        <ProtonApp config={enhancedConfig} hasInitialAuth>
            <ErrorBoundary component={<StandardErrorPage />}>
                <Setup />
            </ErrorBoundary>
        </ProtonApp>
    );
};

export default App;
