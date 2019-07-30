import React from 'react';
import PropTypes from 'prop-types';
import { ErrorBoundary, StandardPrivateApp } from 'react-components';
import { UserModel, UserSettingsModel, CalendarsModel } from 'proton-shared/lib/models';

import OverviewContainer from '../containers/OverviewContainer';
import PrivateLayout from '../components/layout/PrivateLayout';

const EVENT_MODELS = [UserModel, UserSettingsModel, CalendarsModel];

const PRELOAD_MODELS = [UserSettingsModel, UserModel];

const PrivateApp = ({ onLogout }) => {
    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={{} /* todo */}
            preloadModels={PRELOAD_MODELS}
            eventModels={EVENT_MODELS}
        >
            <ErrorBoundary>
                <PrivateLayout>
                    <OverviewContainer />
                </PrivateLayout>
            </ErrorBoundary>
        </StandardPrivateApp>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
