import { userSettingsThunk, userThunk } from '@proton/account';
import { FeatureCode, StandardPrivateApp, useApi } from '@proton/components';
import { fetchFeatures } from '@proton/features';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import AccountLoaderPage from './AccountLoaderPage';
import { useAccountDispatch } from './store/hooks';
import { extendStore } from './store/store';

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ './MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const dispatch = useAccountDispatch();

    return (
        <StandardPrivateApp
            loader={<AccountLoaderPage />}
            onLogout={onLogout}
            onInit={async () => {
                extendStore({ api: silentApi, eventManager: null as any });

                const setupModels = async () => {
                    const [user, userSettings, features] = await Promise.all([
                        dispatch(userThunk()),
                        dispatch(userSettingsThunk()),
                        dispatch(fetchFeatures([FeatureCode.EarlyAccessScope])),
                    ]);
                    return { user, userSettings, features };
                };

                const setupEventManager = async () => {
                    const eventID = await api<{ EventID: string }>(getLatestID()).then(({ EventID }) => EventID);

                    return {
                        eventManager: createEventManager({
                            api: silentApi,
                            eventID,
                            query: (eventID: string) => getEvents(eventID),
                        }),
                    };
                };

                const initPromise = Promise.all([setupModels(), setupEventManager()]);

                const [models, ev] = await initPromise;

                extendStore({ api: silentApi, eventManager: ev.eventManager });

                return {
                    ...models,
                    ...ev,
                };
            }}
            locales={locales}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            hasMemberKeyMigration
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
