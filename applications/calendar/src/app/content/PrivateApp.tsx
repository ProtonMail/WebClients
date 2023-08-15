import {
    FeatureCode,
    LoaderPage,
    StandardPrivateApp,
    useApi,
    useAppTitle,
    useDrawer,
    useDrawerParent,
} from '@proton/components';
import { useGetHolidaysDirectory } from '@proton/components/containers/calendar/hooks/useHolidaysDirectory';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    AddressesModel,
    CalendarUserSettingsModel,
    CalendarsModel,
    ContactEmailsModel,
    ContactsModel,
    LabelsModel,
    MailSettingsModel,
    UserInvitationModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';
import noop from '@proton/utils/noop';

const EVENT_MODELS = [
    UserModel,
    UserSettingsModel,
    MailSettingsModel,
    AddressesModel,
    ContactEmailsModel,
    ContactsModel,
    LabelsModel,
    UserInvitationModel,
];

const PRELOAD_MODELS = [UserModel, UserSettingsModel, AddressesModel, CalendarsModel, CalendarUserSettingsModel];

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ '../containers/calendar/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}
const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const getHolidaysDirectory = useGetHolidaysDirectory(silentApi);
    const { setShowDrawerSidebar } = useDrawer();

    useAppTitle('');

    useDrawerParent();

    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={locales}
            onInit={() => {
                // Intentionally ignoring to return promises to avoid blocking app start
                loadAllowedTimeZones(silentApi).catch(noop);
                getHolidaysDirectory().catch(noop);
            }}
            preloadModels={PRELOAD_MODELS}
            preloadFeatures={[FeatureCode.CalendarFetchMetadataOnly, FeatureCode.AutoAddHolidaysCalendars]}
            eventModels={EVENT_MODELS}
            loader={<LoaderPage />}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            hasMemberKeyMigration
            app={getAppContainer}
            onUserSettings={({ HideSidePanel }) => setShowDrawerSidebar(HideSidePanel === DRAWER_VISIBILITY.SHOW)}
        />
    );
};

export default PrivateApp;
