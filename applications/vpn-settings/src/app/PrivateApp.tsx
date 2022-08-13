import { StandardPrivateApp } from '@proton/components';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    AddressesModel,
    MailSettingsModel,
    OrganizationModel,
    PaymentMethodsModel,
    SubscriptionModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';

const getAppContainer = () => import('./MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateApp = ({ onLogout, locales }: Props) => {
    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={locales}
            preloadModels={[UserModel, UserSettingsModel]}
            eventModels={[
                UserModel,
                AddressesModel,
                MailSettingsModel,
                UserSettingsModel,
                SubscriptionModel,
                PaymentMethodsModel,
                OrganizationModel,
            ]}
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
