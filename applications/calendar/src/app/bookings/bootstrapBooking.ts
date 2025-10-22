import { registerSessionListener } from '@proton/account/accountSessions/registerSessionListener';
import { createAuthentication, createUnleash, init } from '@proton/account/bootstrap';
import createApi from '@proton/shared/lib/api/createApi';
import { handleLogoutFromURL } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import config from '../config';
import locales from '../locales';
import { setupStore } from '../store/bookingsStore';

export const bootstrapBooking = async () => {
    const api = createApi({ config, sendLocaleHeaders: true });

    registerSessionListener({ type: 'all' });
    handleLogoutFromURL({ api });

    const authentication = createAuthentication({ initialAuth: false });
    init({ config, authentication, locales });

    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });
    await unleashClient.start();

    const store = setupStore();

    return { authentication, unauthenticatedApi, unleashClient, api, store };
};
