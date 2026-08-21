import { addressesThunk } from '@proton/account/addresses';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { serverEvent } from '@proton/account/eventLoop';
import { initEvent } from '@proton/account/init';
import { userThunk } from '@proton/account/user';
import { userKeysThunk } from '@proton/account/userKeys';
import { userPermissionsThunk } from '@proton/account/userPermissions';
import { userSettingsThunk } from '@proton/account/userSettings';
import { welcomeFlagsActions } from '@proton/account/welcomeFlags';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces';
import { telemetry } from '@proton/shared/lib/telemetry';
import noop from '@proton/utils/noop';

import type { AccountStore } from './store/store';
import { extendStore } from './store/store';
import { extraThunkArguments } from './store/thunk';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './MainContainer').then((result) => result.default);

export const bootstrapApp = async ({ store, locales }: { store: AccountStore; locales: TtagLocaleMap }) => {
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

            bootstrap.enableTelemetryBasedOnUserSettings({ userSettings });
            await bootstrap.loadLocales({ userSettings, locales });

            return { user, userSettings, earlyAccessScope: undefined };
        };

        const userPromise = loadUser();
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        const [MainContainer, userData] = await Promise.all([
            appContainerPromise,
            userPromise,
            bootstrap.loadCrypto({ appName, unleashClient }),
            unleashPromise,
        ]);
        dispatch(userPermissionsThunk()).catch(noop);

        if (!!userData.userSettings.Telemetry) {
            telemetry.init({
                config,
                uid: authentication.UID,
                eventOptions: {
                    pageView: false,
                    click: false,
                    form: false,
                    performance: false,
                    modal: false,
                    exit: false,
                },
                overriddenPageTitle: 'VPN Settings',
            });
        }

        // Needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });

        // VPN doesn't use addresses or keys directly but some functionality requires addresses to be loaded (e.g. session recovery).
        // So we prefetch it here but don't care about the result to make sure they are loaded.
        Promise.all([dispatch(addressesThunk()), dispatch(userKeysThunk())]).catch(noop);

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
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
