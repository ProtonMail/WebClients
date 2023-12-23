import { addressesThunk, userSettingsThunk, userThunk } from '@proton/account';
import { calendarSettingsThunk, calendarsThunk, holidayCalendarsThunk } from '@proton/calendar';
import {
    FeatureCode,
    LoaderPage,
    StandardPrivateApp,
    useApi,
    useAppTitle,
    useDrawer,
    useDrawerParent,
} from '@proton/components';
import { fetchFeatures } from '@proton/features';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import noop from '@proton/utils/noop';

import { useCalendarDispatch } from '../store/hooks';
import { extendStore } from '../store/store';

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ '../containers/calendar/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const dispatch = useCalendarDispatch();
    const { setShowDrawerSidebar } = useDrawer();

    useAppTitle('');

    useDrawerParent();

    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={locales}
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
                                FeatureCode.CalendarFetchMetadataOnly,
                                FeatureCode.AutoAddHolidaysCalendars,
                            ])
                        ),
                        dispatch(calendarsThunk()),
                        dispatch(calendarSettingsThunk()),
                    ]);

                    return { user, userSettings, addresses, features };
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
                // Intentionally ignoring to return promise of the timezone call to avoid blocking app start
                loadAllowedTimeZones(getSilentApi(api)).catch(noop);
                dispatch(holidayCalendarsThunk()).catch(noop);

                const [models, ev] = await initPromise;

                extendStore({ api: silentApi, eventManager: ev.eventManager });

                setShowDrawerSidebar(models.userSettings.HideSidePanel === DRAWER_VISIBILITY.SHOW);

                return {
                    ...models,
                    ...ev,
                };
            }}
            loader={<LoaderPage />}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            hasMemberKeyMigration
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
