import { ErrorBoundary, ProtonApp, StandardErrorPage, getSessionTrackingEnabled } from '@proton/components';
import { initMainHost } from '@proton/cross-storage';
import metrics from '@proton/metrics';
import { getClientID } from '@proton/shared/lib/apps/helper';
import authentication from '@proton/shared/lib/authentication/authentication';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import sentry from '@proton/shared/lib/helpers/sentry';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';

import Setup from './Setup';
import * as config from './config';
import locales from './locales';

import './app.scss';

setTtagLocales(locales);
initMainHost();
newVersionUpdater(config);
sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });
setVcalProdId(getProdId(config));

metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

const App = () => {
    return (
        <ProtonApp authentication={authentication} config={config}>
            <ErrorBoundary component={<StandardErrorPage big />}>
                <Setup />
            </ErrorBoundary>
        </ProtonApp>
    );
};

export default App;
