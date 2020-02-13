import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { StandardPrivateApp, ErrorBoundary, LoaderPage, useApi, useCache } from 'react-components';
import { c } from 'ttag';
import {
    UserModel,
    UserSettingsModel,
    CalendarsModel,
    CalendarUserSettingsModel,
    AddressesModel,
    MailSettingsModel
} from 'proton-shared/lib/models';
import { loadModels } from 'proton-shared/lib/models/helper';
import updateLongLocale from 'proton-shared/lib/i18n/updateLongLocale';

import MainContainer from '../containers/calendar/MainContainer';
import { SETTINGS_TIME_FORMAT } from '../constants';

const EVENT_MODELS = [
    UserModel,
    UserSettingsModel,
    MailSettingsModel,
    CalendarsModel,
    CalendarUserSettingsModel,
    AddressesModel
];

const PRELOAD_MODELS = [UserModel, UserSettingsModel, MailSettingsModel, AddressesModel];

const PrivateApp = ({ onLogout }) => {
    const api = useApi();
    const cache = useCache();

    useEffect(() => {
        document.title = 'ProtonCalendar';
    }, []);

    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={{} /* todo */}
            onInit={async () => {
                const calendars = await loadModels([CalendarsModel], { api, cache });
                if (calendars && calendars.length) {
                    // The calendar user settings can only be fetched if calendars have been setup.
                    const [{ TimeFormat }] = await loadModels([CalendarUserSettingsModel], { api, cache });
                    updateLongLocale({ displayAMPM: TimeFormat === SETTINGS_TIME_FORMAT.H12 });
                }
            }}
            preloadModels={PRELOAD_MODELS}
            eventModels={EVENT_MODELS}
            fallback={<LoaderPage text={c('Info').t`Loading ProtonCalendar`} />}
        >
            <ErrorBoundary>
                <MainContainer />
            </ErrorBoundary>
        </StandardPrivateApp>
    );
};

PrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default PrivateApp;
