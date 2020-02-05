import React from 'react';
import PropTypes from 'prop-types';
import { StandardPrivateApp } from 'react-components';
import {
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    SubscriptionModel,
    OrganizationModel,
    AddressesModel,
    PaymentMethodsModel
} from 'proton-shared/lib/models';

import PrivateLayout from './components/layout/PrivateLayout';
import locales from './locales';

const PrivateApp = ({ onLogout }) => {
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
                OrganizationModel
            ]}
        >
            <PrivateLayout />
        </StandardPrivateApp>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
