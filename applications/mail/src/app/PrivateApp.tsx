import { addressesThunk, userSettingsThunk, userThunk } from '@proton/account';
import { FeatureCode, LoaderPage, StandardPrivateApp } from '@proton/components/containers';
import { useApi, useDrawer } from '@proton/components/hooks';
import { fetchFeatures } from '@proton/features';
import { categoriesThunk, contactEmailsThunk, mailSettingsThunk } from '@proton/mail';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import noop from '@proton/utils/noop';

import { useMailDispatch } from './store/hooks';
import { extendStore } from './store/store';

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ './MainContainer');

const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const dispatch = useMailDispatch();

    const { setShowDrawerSidebar } = useDrawer();

    return (
        <StandardPrivateApp
            noModals
            loader={<LoaderPage />}
            onLogout={onLogout}
            onInit={async () => {
                extendStore({ api: silentApi, eventManager: null as any });

                const setupModels = async () => {
                    const [user, addresses, userSettings, features] = await Promise.all([
                        dispatch(userThunk()),
                        dispatch(addressesThunk()),
                        dispatch(userSettingsThunk()),
                        dispatch(
                            fetchFeatures([
                                FeatureCode.EarlyAccessScope,
                                FeatureCode.CleanUTMTrackers,
                                FeatureCode.ESAutomaticBackgroundIndexing,
                                FeatureCode.MailActionsChunkSize,
                            ])
                        ),
                        dispatch(mailSettingsThunk()),
                        dispatch(contactEmailsThunk()),
                        dispatch(categoriesThunk()),
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
                // Intentionally ignoring to return promise of the timezone call to avoid blocking app start
                loadAllowedTimeZones(getSilentApi(api)).catch(noop);

                const [models, ev] = await initPromise;

                extendStore({ api: silentApi, eventManager: ev.eventManager });

                setShowDrawerSidebar(models.userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW);

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
