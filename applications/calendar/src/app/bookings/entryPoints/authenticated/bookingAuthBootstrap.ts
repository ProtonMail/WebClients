import { readAccountSessions } from '@proton/account/accountSessions/storage';
import {
    createAuthentication,
    createHistory,
    createUnleash,
    init,
    loadCrypto,
    loadSession,
    unleashReady,
    wrap,
} from '@proton/account/bootstrap';
import { initMainHost } from '@proton/cross-storage/lib';
import createApi from '@proton/shared/lib/api/createApi';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import noop from '@proton/utils/noop';

import config from '../../../config';
import locales from '../../../locales';
import { setupStore } from '../../../store/bookingsStore';
import { extendStore } from '../../../store/store';
import type { BookingAuthBootstrapResult } from '../interface';

export const bookingAuthBootstrap = async (): Promise<BookingAuthBootstrapResult | 'redirect'> => {
    const accountSessions = readAccountSessions();
    if (!accountSessions) {
        return 'redirect';
    }

    const api = createApi({ config, sendLocaleHeaders: true });
    const unauthenticatedApi = createUnauthenticatedApi(api);
    const authentication = createAuthentication();
    init({ config, authentication, locales });

    // TODO is this needed?
    //telemetry.init({ config, uid: authentication.UID});

    initMainHost();
    initSafariFontFixClassnames();

    const run = async () => {
        const sessionResult = await loadSession({
            authentication,
            api,
            pathname: window.location.pathname,
            searchParams: new URLSearchParams(window.location.search),
            unauthenticatedReturnUrl: '/guest',
        });

        const history = createHistory({ sessionResult, pathname: window.location.pathname });
        const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });

        await loadCrypto({ appName: config.APP_NAME, unleashClient });
        await unleashReady({ unleashClient }).catch(noop);

        extendStore({
            config,
            api,
            authentication,
            history,
            unleashClient,
        });

        return {
            store: setupStore(),
            api,
            unleashClient,
            authentication,
            history,
        };
    };

    return wrap({ appName: config.APP_NAME, authentication }, run());
};
