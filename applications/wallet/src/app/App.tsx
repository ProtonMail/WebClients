import { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import {
    ArcElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';

import { LoaderPage, ProtonApp, StandardPublicApp, StandardSetup, getSessionTrackingEnabled } from '@proton/components';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import metrics from '@proton/metrics/index';
import { getClientID } from '@proton/shared/lib/apps/helper';
import authentication from '@proton/shared/lib/authentication/authentication';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import sentry from '@proton/shared/lib/helpers/sentry';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';

import { setPanicHook } from '../pkg';
import PrivateApp from './PrivateApp';
import * as config from './config';
import locales from './locales';

import './app.scss';

setTtagLocales(locales);
setupGuestCrossStorage();
newVersionUpdater(config);
sentry({ config, uid: authentication.getUID(), sessionTracking: getSessionTrackingEnabled() });

metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

const App = () => {
    const [hasInitialAuth] = useState(() => {
        return !window.location.pathname.startsWith('/pay');
    });

    useEffect(() => {
        setPanicHook();
    }, []);

    return (
        <ProtonApp authentication={authentication} config={config} hasInitialAuth={hasInitialAuth}>
            <Switch>
                <Route path="/pay">
                    <StandardPublicApp loader={<LoaderPage />} locales={locales}>
                        <div className="h-full">{/* <PublicPaymentLinkContainer /> */}</div>
                    </StandardPublicApp>
                </Route>
                <Route path="*">
                    <StandardSetup PrivateApp={PrivateApp} locales={locales} />
                </Route>
            </Switch>
        </ProtonApp>
    );
};

export default App;
