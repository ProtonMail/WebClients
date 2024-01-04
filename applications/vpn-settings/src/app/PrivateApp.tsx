import { StandardPrivateApp } from '@proton/components';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    AddressesModel,
    DomainsModel,
    MailSettingsModel,
    MembersModel,
    OrganizationModel,
    PaymentMethodsModel,
    SamlSSOModel,
    SubscriptionModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';

import AccountLoaderPage from './AccountLoaderPage';

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ './MainContainer');

const EVENT_MODELS = [
    UserModel,
    AddressesModel,
    MailSettingsModel,
    UserSettingsModel,
    SubscriptionModel,
    PaymentMethodsModel,
    OrganizationModel,
    DomainsModel,
    MembersModel,
    SamlSSOModel,
];

const PRELOAD_MODELS = [UserModel, UserSettingsModel];

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateApp = ({ onLogout, locales }: Props) => {
    return (
        <StandardPrivateApp
            loader={<AccountLoaderPage />}
            onLogout={onLogout}
            locales={locales}
            preloadModels={PRELOAD_MODELS}
            eventModels={EVENT_MODELS}
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
