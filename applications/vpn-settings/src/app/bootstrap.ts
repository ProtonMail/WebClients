import { initEvent, serverEvent, userSettingsThunk, userThunk, welcomeFlagsActions } from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { AccountStore } from './store/store';
import { extendStore } from './store/store';
import { extraThunkArguments } from './store/thunk';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './MainContainer').then((result) => result.default);

export const bootstrapApp = async ({
    store,
    locales,
    signal,
}: {
    store: AccountStore;
    locales: TtagLocaleMap;
    signal?: AbortSignal;
}) => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const { config, api, authentication, history } = extraThunkArguments;
    const silentApi = getSilentApi(api);

    const appName = config.APP_NAME;

    const run = async () => {
        const appContainerPromise = getAppContainer();
        const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams });

        const unleashClient = bootstrap.createUnleash({ api: silentApi });

        const user = sessionResult.session?.User;
        extendStore({ unleashClient });

        const dispatch = store.dispatch;

        if (user) {
            dispatch(initEvent({ User: user }));
        }

        const loadUser = async () => {
            const [user, userSettings] = await Promise.all([dispatch(userThunk()), dispatch(userSettingsThunk())]);

            dispatch(welcomeFlagsActions.initial(userSettings));

            const [scopes] = await Promise.all([
                bootstrap.initUser({ appName, user, userSettings }),
                bootstrap.loadLocales({ userSettings, locales }),
            ]);

            return { user, userSettings, earlyAccessScope: undefined, scopes };
        };

        const userPromise = loadUser();
        const evPromise = bootstrap.eventManager({ api: silentApi });
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        await unleashPromise;
        // Needs unleash to be loaded.
        await bootstrap.loadCrypto({ appName, unleashClient });
        const [MainContainer, userData, eventManager] = await Promise.all([
            appContainerPromise,
            userPromise,
            evPromise,
        ]);
        // Needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });

        extendStore({ eventManager });
        const unsubscribeEventManager = eventManager.subscribe((event) => {
            dispatch(serverEvent(event));
        });
        eventManager.start();

        bootstrap.onAbort(signal, () => {
            unsubscribeEventManager();
            eventManager.reset();
            unleashClient.stop();
            store.unsubscribe();
        });

        dispatch(bootstrapEvent({ type: 'complete' }));

        return {
            ...userData,
            eventManager,
            unleashClient,
            history,
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
