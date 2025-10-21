import { createBrowserHistory } from 'history';

import { registerSessionListener } from '@proton/account/accountSessions/registerSessionListener';
import * as bootstrap from '@proton/account/bootstrap';
import createApi from '@proton/shared/lib/api/createApi';
import { handleLogoutFromURL } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import config from '../config';
import locales from '../locales';

export const bootstrapBooking = () => {
    const api = createApi({ config, sendLocaleHeaders: true });

    registerSessionListener({ type: 'all' });
    handleLogoutFromURL({ api });

    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, authentication, locales });

    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = bootstrap.createUnleash({ api: unauthenticatedApi.apiCallback });

    const history = createBrowserHistory({ basename: '/bookings' });
    return { authentication, unauthenticatedApi, unleashClient, history };
};
