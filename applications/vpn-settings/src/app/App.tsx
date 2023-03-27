import {
    ErrorBoundary,
    PrivateAuthenticationStore,
    ProtonApp,
    PublicAuthenticationStore,
    StandardErrorPage,
    getSessionTrackingEnabled,
    useAuthentication,
} from '@proton/components';
import metrics from '@proton/metrics';
import { getClientID } from '@proton/shared/lib/apps/helper';
import authentication from '@proton/shared/lib/authentication/authentication';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import initLogicalProperties from '@proton/shared/lib/logical/logical';

import PrivateApp from './PrivateApp';
import PublicApp from './PublicApp';
import * as config from './config';

import './app.scss';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

newVersionUpdater(config);
sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });
initLogicalProperties();

metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

const Setup = () => {
    const { UID, login, logout } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;
    if (UID) {
        return <PrivateApp onLogout={logout} locales={locales} />;
    }
    return <PublicApp onLogin={login} locales={locales} />;
};

const App = () => {
    return (
        <ProtonApp authentication={authentication} config={config}>
            <ErrorBoundary component={<StandardErrorPage />}>
                <Setup />
            </ErrorBoundary>
        </ProtonApp>
    );
};

export default App;
