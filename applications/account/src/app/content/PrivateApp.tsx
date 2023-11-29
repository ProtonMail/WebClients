import { userSettingsThunk, userThunk } from '@proton/account';
import { FeatureCode, StandardPrivateApp, useApi } from '@proton/components';
import { useGetHolidaysDirectory } from '@proton/components/containers/calendar/hooks/useHolidaysDirectory';
import { fetchFeatures } from '@proton/features';
import { mailSettingsThunk } from '@proton/mail';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { ImportReportsModel, ImportersModel } from '@proton/shared/lib/models';
import noop from '@proton/utils/noop';

import { useAccountDispatch } from '../store/hooks';
import { extendStore } from '../store/store';
import AccountLoaderPage from './AccountLoaderPage';

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ './SetupMainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const getHolidaysDirectory = useGetHolidaysDirectory(silentApi);
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
                        dispatch(mailSettingsThunk()),
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
                // Intentionally ignoring to return promises to avoid blocking app start
                loadAllowedTimeZones(silentApi).catch(noop);
                getHolidaysDirectory().catch(noop);

                const [models, ev] = await initPromise;

                extendStore({ api: silentApi, eventManager: ev.eventManager });

                return {
                    ...models,
                    ...ev,
                };
            }}
            locales={locales}
            eventModels={[ImportReportsModel, ImportersModel]}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            hasMemberKeyMigration
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
