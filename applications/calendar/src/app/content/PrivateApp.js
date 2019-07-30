import React from 'react';
import PropTypes from 'prop-types';
import { ErrorBoundary, StandardPrivateApp, AppsSidebar } from 'react-components';
import { UserModel, UserSettingsModel, CalendarsModel } from 'proton-shared/lib/models';

import OverviewContainer from '../containers/OverviewContainer';
import PrivateHeader from '../components/layout/PrivateHeader';

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
                <div className="flex flex-nowrap no-scroll">
                    <AppsSidebar currentApp="protoncalendar" />
                    <div className="content flex-item-fluid reset4print">
                        <PrivateHeader />
                        <div className="flex flex-nowrap">
                            <OverviewContainer />
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </StandardPrivateApp>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
