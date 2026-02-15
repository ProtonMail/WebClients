import { readAccountSessions } from '@proton/account/accountSessions/storage';
import {
    createAuthentication,
    createHistory,
    createUnleash,
    init,
    loadCrypto,
    unleashReady,
} from '@proton/account/bootstrap';
import { initMainHost } from '@proton/cross-storage/lib';
import createApi from '@proton/shared/lib/api/createApi';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { getBrowserLocale } from '@proton/shared/lib/i18n/helper';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import { locales as sharedLocales } from '@proton/shared/lib/i18n/locales';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import noop from '@proton/utils/noop';

import config from '../../../config';
import locales from '../../../locales';
import { setupGuestBookingStore } from '../../../store/bookingsStore';
import { extendStore } from '../../../store/store';
import type { BookingGuestBootstrapResult } from '../interface';

export const bookingGuestBootstrap = async (): Promise<BookingGuestBootstrapResult | 'redirect'> => {
    const accountSessions = readAccountSessions();
    if (accountSessions) {
        return 'redirect';
    }

    const api = createApi({ config });
    const authentication = createAuthentication({ initialAuth: false });
    init({ config, authentication, locales });

    // TODO is this needed?
    //telemetry.init({ config, uid: authentication.UID});

    initMainHost();
    initSafariFontFixClassnames();

    const pathname = window.location.pathname;
    const sessionResult = { basename: undefined, url: undefined };
    const history = createHistory({ sessionResult, pathname });

    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });

    extendStore({
        config,
        api,
        authentication,
        history,
        unleashClient,
    });

    await unleashReady({ unleashClient }).catch(noop);
    await loadCrypto({ appName: config.APP_NAME, unleashClient });

    await loadLocales({
        locale: getBrowserLocale(),
        locales: sharedLocales,
        userSettings: undefined,
    });

    return {
        store: setupGuestBookingStore(),
        unauthenticatedApi,
    };
};
