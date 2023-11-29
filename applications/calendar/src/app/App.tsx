import { ProtonApp, StandardSetup, getSessionTrackingEnabled } from '@proton/components';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import metrics from '@proton/metrics';
import { getClientID } from '@proton/shared/lib/apps/helper';
import authentication from '@proton/shared/lib/authentication/authentication';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import sentry from '@proton/shared/lib/helpers/sentry';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';

import * as config from './config';
import PrivateApp from './content/PrivateApp';
import locales from './locales';
import CalendarStoreProvider from './store/CalendarStoreProvider';

import './app.scss';

setTtagLocales(locales);
setupGuestCrossStorage();
newVersionUpdater(config);
sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });
setVcalProdId(getProdId(config));

metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

const App = () => {
    return (
        <CalendarStoreProvider>
            <ProtonApp authentication={authentication} config={config}>
                <StandardSetup PrivateApp={PrivateApp} locales={locales} />
            </ProtonApp>
        </CalendarStoreProvider>
    );
};

export default App;
