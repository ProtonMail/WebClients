import { StandardPrivateApp, useApi } from '@proton/components';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    AddressesModel,
    ContactEmailsModel,
    ContactsModel,
    DomainsModel,
    FiltersModel,
    ImportReportsModel,
    ImportersModel,
    LabelsModel,
    MailSettingsModel,
    MembersModel,
    OrganizationModel,
    PaymentMethodsModel,
    SubscriptionModel,
    UserInvitationModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';
import noop from '@proton/utils/noop';

import AccountLoaderPage from './AccountLoaderPage';

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
    UserInvitationModel,
];

const PRELOAD_MODELS = [UserSettingsModel, MailSettingsModel, UserModel];

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ './SetupMainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();

    return (
        <StandardPrivateApp
            loader={<AccountLoaderPage />}
            onLogout={onLogout}
            onInit={() => {
                // Intentionally ignoring to return promise of the timezone call to avoid blocking app start
                loadAllowedTimeZones(getSilentApi(api)).catch(noop);
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
