import { StandardPrivateApp } from '@proton/components';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { Model } from '@proton/shared/lib/interfaces/Model';
import {
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    SubscriptionModel,
    OrganizationModel,
    LabelsModel,
    AddressesModel,
    ConversationCountsModel,
    MessageCountsModel,
    ContactsModel,
    ContactEmailsModel,
    DomainsModel,
    FiltersModel,
    MembersModel,
    PaymentMethodsModel,
    ImportersModel,
    CalendarsModel,
    CalendarUserSettingsModel,
} from '@proton/shared/lib/models';

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const getAppContainer = () => import('./MainContainer');

const PrivateApp = ({ onLogout, locales }: Props) => {
    return (
        <StandardPrivateApp
            noModals
            fallback={false}
            openpgpConfig={{}}
            onLogout={onLogout}
            locales={locales}
            preloadModels={[
                UserModel,
                UserSettingsModel,
                LabelsModel,
                AddressesModel,
                MailSettingsModel,
                ContactEmailsModel,
            ]}
            eventModels={[
                UserModel,
                AddressesModel,
                ConversationCountsModel as Model<any>,
                MessageCountsModel as Model<any>,
                MailSettingsModel,
                UserSettingsModel,
                LabelsModel,
                SubscriptionModel,
                OrganizationModel,
                ContactsModel,
                ContactEmailsModel,
                DomainsModel,
                FiltersModel,
                MembersModel,
                PaymentMethodsModel,
                ImportersModel,
                CalendarsModel,
                CalendarUserSettingsModel,
            ]}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            hasMemberKeyMigration
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
