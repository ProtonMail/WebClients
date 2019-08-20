import React from 'react';
import PropTypes from 'prop-types';
import { StandardPrivateApp } from 'react-components';
import {
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    SubscriptionModel,
    OrganizationModel
} from 'proton-shared/lib/models';

import PrivateLayout from './components/layout/PrivateLayout';
import PrivateAppRoutes from './PrivateAppRoutes';

const PrivateApp = ({ onLogout }) => {
    return (
        <StandardPrivateApp
            onLogout={onLogout}
            preloadModels={[UserModel, UserSettingsModel]}
            eventModels={[UserModel, MailSettingsModel, UserSettingsModel, SubscriptionModel, OrganizationModel]}
        >
            <PrivateLayout>
                <PrivateAppRoutes />
            </PrivateLayout>
        </StandardPrivateApp>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
