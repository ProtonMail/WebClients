import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { serverEvent } from '@proton/account/eventLoop';
import { initEvent } from '@proton/account/init';
import { startLogoutListener } from '@proton/account/persist/listener';
import { userThunk } from '@proton/account/user';
import { userSettingsThunk } from '@proton/account/userSettings';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import noop from '@proton/utils/noop';

import { extendStore, setupStore } from './store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './MainContainer').then((result) => result.default);

// The console app is not translated yet, so it always runs with the default (English) strings.
const locales: TtagLocaleMap = {};

export const bootstrapApp = async ({ config }: { config: ProtonConfig }) => {
    const appName = config.APP_NAME;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    initSafariFontFixClassnames();
    startLogoutListener();

    const run = async () => {
        const appContainerPromise = getAppContainer();
        // Without a session this throws, which makes `bootstrap.wrap` request a fork from the account app.
        const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams });

        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        const user = sessionResult.session?.User;
        extendStore({ config, api, authentication, unleashClient, history });

        const store = setupStore();
        const dispatch = store.dispatch;

        if (user) {
            dispatch(initEvent({ User: user }));
        }

        const loadUser = async () => {
            const [user, userSettings] = await Promise.all([dispatch(userThunk()), dispatch(userSettingsThunk())]);

            bootstrap.enableTelemetryBasedOnUserSettings({ userSettings });

            return { user, userSettings, earlyAccessScope: undefined };
        };

        const [MainContainer, userData] = await Promise.all([
            appContainerPromise,
            loadUser(),
            bootstrap.loadCrypto({ appName, unleashClient }),
            unleashPromise,
        ]);

        // Needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });

        const eventManager = bootstrap.eventManager({ api: silentApi });
        extendStore({ eventManager });

        eventManager.subscribe((event) => {
            dispatch(serverEvent(event));
        });
        eventManager.start();

        dispatch(bootstrapEvent({ type: 'complete' }));

        return {
            ...userData,
            eventManager,
            unleashClient,
            history,
            store,
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
