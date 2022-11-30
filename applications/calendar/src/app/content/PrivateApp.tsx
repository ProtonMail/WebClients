import {
    FeatureCode,
    LoaderPage,
    StandardPrivateApp,
    useApi,
    useAppTitle,
    useDrawer,
    useDrawerParent,
    useProtonMailMigrationRedirect,
} from '@proton/components';
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
];

const PRELOAD_MODELS = [UserModel, UserSettingsModel, AddressesModel, CalendarsModel, CalendarUserSettingsModel];

const getAppContainer = () => import('../containers/calendar/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}
const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();

    useProtonMailMigrationRedirect();

    useAppTitle('');

    useDrawerParent();
    const { setShowDrawerSidebar } = useDrawer();

    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={locales}
            onInit={() => loadAllowedTimeZones(getSilentApi(api)).catch(noop)}
            onUserSettings={({ HideSidePanel }) => setShowDrawerSidebar(HideSidePanel === DRAWER_VISIBILITY.SHOW)}
            preloadModels={PRELOAD_MODELS}
            preloadFeatures={[FeatureCode.Drawer]}
            eventModels={EVENT_MODELS}
            fallback={<LoaderPage />}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            hasMemberKeyMigration
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
