import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
    EventManagerProvider,
    EventModelListener,
    EventNotices,
    ErrorBoundary,
    LoaderPage,
    ThemeInjector,
    ModalsChildren
} from 'react-components';
import { c } from 'ttag';
import {
    UserModel,
    UserSettingsModel,
    CalendarsModel,
    CalendarUserSettingsModel,
    AddressesModel,
    MailSettingsModel
} from 'proton-shared/lib/models';

import CalendarPreload from './CalendarPreload';
import MainContainer from '../containers/calendar/MainContainer';

const EVENT_MODELS = [
    UserModel,
    UserSettingsModel,
    MailSettingsModel,
    CalendarsModel,
    CalendarUserSettingsModel,
    AddressesModel
];

const PRELOAD_MODELS = [UserModel, UserSettingsModel, MailSettingsModel, CalendarsModel, AddressesModel];

const PrivateApp = ({ onLogout }) => {
    const [loading, setLoading] = useState(true);
    const eventManagerRef = useRef();

    useEffect(() => {
        document.title = 'ProtonCalendar';
    }, []);

    if (loading) {
        return (
            <>
                <CalendarPreload
                    locales={{}}
                    preloadModels={PRELOAD_MODELS}
                    onSuccess={(ev) => {
                        eventManagerRef.current = ev;
                        setLoading(false);
                    }}
                    onError={onLogout}
                />
                <ModalsChildren />
                <LoaderPage text={c('Info').t`Loading ProtonCalendar`} />
            </>
        );
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <ModalsChildren />
            <EventModelListener models={EVENT_MODELS} />
            <EventNotices />
            <ThemeInjector />
            <ErrorBoundary>
                <MainContainer />
            </ErrorBoundary>
        </EventManagerProvider>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
