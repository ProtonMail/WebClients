import React from 'react';
import { StandardPrivateApp } from '@proton/components';
import {
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    SubscriptionModel,
    OrganizationModel,
    AddressesModel,
    PaymentMethodsModel,
} from '@proton/shared/lib/models';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

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
