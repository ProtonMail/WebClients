import { ProtonApp, StandardSetup, getSessionTrackingEnabled } from '@proton/components';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import authentication from '@proton/shared/lib/authentication/authentication';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import sentry from '@proton/shared/lib/helpers/sentry';
import { setLocales } from '@proton/shared/lib/i18n';

import * as config from './config';
import PrivateApp from './content/PrivateApp';
import locales from './locales';

import './app.scss';

setLocales(locales);
setupGuestCrossStorage();
newVersionUpdater(config);
sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });
setVcalProdId(getProdId(config));

const App = () => {
    return (
        <ProtonApp authentication={authentication} config={config}>
            <StandardSetup PrivateApp={PrivateApp} locales={locales} />
        </ProtonApp>
    );
};

export default App;
