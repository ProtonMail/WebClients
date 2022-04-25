import {
    ProtonApp,
    useAuthentication,
    PublicAuthenticationStore,
    PrivateAuthenticationStore,
    ErrorBoundary,
    StandardErrorPage,
} from '@proton/components';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';

import * as config from './config';
import PrivateApp from './PrivateApp';
import PublicApp from './PublicApp';

import './app.scss';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const enhancedConfig = {
    ...config,
};

newVersionUpdater(enhancedConfig);
sentry(enhancedConfig);

const Setup = () => {
    const { UID, login, logout } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;
    if (UID) {
        return <PrivateApp onLogout={logout} locales={locales} />;
    }
    return <PublicApp onLogin={login} locales={locales} />;
};

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
