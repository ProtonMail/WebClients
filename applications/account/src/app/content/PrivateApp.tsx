import { StandardPrivateApp, useApi } from '@proton/components';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    DomainsModel,
    AddressesModel,
    LabelsModel,
    FiltersModel,
    OrganizationModel,
    MembersModel,
    SubscriptionModel,
    PaymentMethodsModel,
    ImportersModel,
    ImportReportsModel,
    ContactsModel,
    ContactEmailsModel,
} from '@proton/shared/lib/models';
import noop from '@proton/utils/noop';

const EVENT_MODELS = [
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    AddressesModel,
    DomainsModel,
    LabelsModel,
    FiltersModel,
    SubscriptionModel,
    OrganizationModel,
    MembersModel,
    PaymentMethodsModel,
    ImportReportsModel,
    ImportersModel,
    ContactsModel,
    ContactEmailsModel,
];

const PRELOAD_MODELS = [UserSettingsModel, MailSettingsModel, UserModel];

const getAppContainer = () => import('./SetupMainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });

    return (
        <StandardPrivateApp
            onLogout={onLogout}
            onInit={() => {
                // Intentionally ignoring to return promise of the timezone call to avoid blocking app start
                loadAllowedTimeZones(silentApi).catch(noop);
            }}
            locales={locales}
            preloadModels={PRELOAD_MODELS}
            eventModels={EVENT_MODELS}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            hasMemberKeyMigration
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
