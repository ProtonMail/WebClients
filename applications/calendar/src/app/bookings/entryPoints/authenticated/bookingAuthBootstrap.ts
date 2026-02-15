import { readAccountSessions } from '@proton/account/accountSessions/storage';
import {
    InvalidSessionError,
    createAuthentication,
    createHistory,
    createUnleash,
    init,
    loadCrypto,
    loadLocales,
    loadSession,
    unleashReady,
} from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import { userSettingsThunk } from '@proton/account/userSettings';
import { initMainHost } from '@proton/cross-storage/lib';
import { mailSettingsThunk } from '@proton/mail/store/mailSettings';
import createApi from '@proton/shared/lib/api/createApi';
import { requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import noop from '@proton/utils/noop';

import config from '../../../config';
import locales from '../../../locales';
import type { CalendarState } from '../../../store/store';
import { extendStore, setupStore } from '../../../store/store';
import type { BookingBootstrapResult } from '../interface';

export const bookingAuthBootstrap = async (): Promise<BookingBootstrapResult | 'redirect'> => {
    const accountSessions = readAccountSessions();
    if (!accountSessions) {
        return 'redirect';
    }

    const api = createApi({ config });
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

        const user = sessionResult.session?.User;

        const persistedState = await getDecryptedPersistedState<Partial<CalendarState>>({
            authentication,
            user,
        });

        const store = setupStore({
            preloadedState: persistedState?.state,
        });

        // We don't want to block the loading while we load the user locales
        void store.dispatch(userSettingsThunk()).then((userSettings) => {
            void loadLocales({ userSettings, locales });
        });

        await store.dispatch(mailSettingsThunk());
        store.dispatch(bootstrapEvent({ type: 'complete' }));
        return {
            store,
        };
    };

    try {
        return await run();
    } catch (e) {
        if (e instanceof InvalidSessionError) {
            requestFork({
                fromApp: APPS.PROTONCALENDAR,
                extra: {
                    localID: (e.extra.localID ?? -1) >= 0 ? e.extra.localID : undefined,
                    // Reload document true so that it redirects from calendar chunk to booking chunk (TODO: Find a better solution with Account)
                    reloadDocument: true,
                    // In case no sessions exist, redirect back to /guest
                    unauthenticatedReturnUrl: '/guest',
                },
            });
            // Promise that never resolves since request fork is performing a redirect.
            await new Promise(() => {});
        }
        throw e;
    }
};
