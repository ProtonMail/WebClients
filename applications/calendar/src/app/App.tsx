import { getSessionTrackingEnabled, ProtonApp, StandardSetup } from '@proton/components';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';
import authentication from '@proton/shared/lib/authentication/authentication';

import * as config from './config';
import PrivateApp from './content/PrivateApp';

import './app.scss';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

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
