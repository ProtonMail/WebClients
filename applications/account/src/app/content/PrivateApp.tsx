import { StandardPrivateApp } from '@proton/components';
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
    CalendarsModel,
    CalendarUserSettingsModel,
    ContactsModel,
    ContactEmailsModel,
} from '@proton/shared/lib/models';
import { LegacyImportersModel, ImportHistoriesModel } from '@proton/shared/lib/models/importersModel';

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
    LegacyImportersModel,
    ImportHistoriesModel,
    CalendarsModel,
    CalendarUserSettingsModel,
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
    return (
        <StandardPrivateApp
            onLogout={onLogout}
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
