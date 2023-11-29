import { addressesThunk, userSettingsThunk, userThunk } from '@proton/account';
import { FeatureCode, LoaderPage, StandardPrivateApp, useApi, useDrawer } from '@proton/components';
import { fetchFeatures } from '@proton/features';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import { useDriveDispatch } from './redux-store/hooks';
import { extendStore } from './redux-store/store';
import { UserSettingsProvider, useUserSettings } from './store';
import { sendErrorReport } from './utils/errorHandling';
import { getRefreshError } from './utils/errorHandling/RefreshError';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './containers/MainContainer').catch((e) => {
        console.warn(e);
        sendErrorReport(e);

        return Promise.reject(getRefreshError());
    });

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateAppInner = ({ onLogout, locales }: Props) => {
    const { loadUserSettings } = useUserSettings();
    const api = useApi();
    const silentApi = getSilentApi(api);
    const dispatch = useDriveDispatch();

    const { setShowDrawerSidebar } = useDrawer();

    return (
        <StandardPrivateApp
            locales={locales}
            onLogout={onLogout}
            loader={<LoaderPage />}
            onInit={async () => {
                extendStore({ api: silentApi, eventManager: null as any });

                const setupModels = async () => {
                    const [user, userSettings, addresses, features] = await Promise.all([
                        dispatch(userThunk()),
                        dispatch(userSettingsThunk()),
                        dispatch(addressesThunk()),
                        dispatch(fetchFeatures([FeatureCode.EarlyAccessScope])),
                        loadUserSettings(),
                    ]);
                    return { user, userSettings, addresses, features };
                };

                const setupEventManager = async () => {
                    const eventID = await api<{ EventID: string }>(getLatestID()).then(({ EventID }) => EventID);

                    return {
                        eventManager: createEventManager({
                            api: silentApi,
                            eventID,
                            query: (eventID: string) => getEvents(eventID, { ConversationCounts: 1, MessageCounts: 1 }),
                        }),
                    };
                };

                const initPromise = Promise.all([setupModels(), setupEventManager()]);

                const [models, ev] = await initPromise;

                extendStore({ api: silentApi, eventManager: ev.eventManager });

                setShowDrawerSidebar(models.userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW);

                return {
                    ...models,
                    ...ev,
                };
            }}
            noModals
            app={getAppContainer}
        />
    );
};

const PrivateApp = (props: Props) => {
    return (
        <UserSettingsProvider>
            <PrivateAppInner {...props} />
        </UserSettingsProvider>
    );
};

export default PrivateApp;
