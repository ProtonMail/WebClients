import { StandardPrivateApp, useApi } from '@proton/components';
import { getEvents } from '@proton/shared/lib/api/events';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { Model } from '@proton/shared/lib/interfaces/Model';
import {
    AddressesModel,
    ContactEmailsModel,
    ContactsModel,
    ConversationCountsModel,
    DomainsModel,
    FiltersModel,
    ImportersModel,
    LabelsModel,
    MailSettingsModel,
    MembersModel,
    MessageCountsModel,
    OrganizationModel,
    PaymentMethodsModel,
    SubscriptionModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';
import noop from '@proton/utils/noop';

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const getAppContainer = () => import('./MainContainer');

const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });

    return (
        <StandardPrivateApp
            noModals
            fallback={false}
            onLogout={onLogout}
            onInit={() => {
                // Intentionally ignoring to return promise of the timezone call to avoid blocking app start
                loadAllowedTimeZones(silentApi).catch(noop);
            }}
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
            ]}
            eventQuery={(eventID: string) => getEvents(eventID, { ConversationCounts: 1, MessageCounts: 1 })}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            hasMemberKeyMigration
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
