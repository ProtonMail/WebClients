import React from 'react';
import { StandardPrivateApp, ErrorBoundary, LoaderPage, useApi, useCache, useAppTitle } from 'react-components';
import { c } from 'ttag';
import {
    UserModel,
    UserSettingsModel,
    CalendarsModel,
    CalendarUserSettingsModel,
    AddressesModel,
    MailSettingsModel,
} from 'proton-shared/lib/models';
import { loadModels } from 'proton-shared/lib/models/helper';
import updateLongLocale from 'proton-shared/lib/i18n/updateLongLocale';
import { SETTINGS_TIME_FORMAT } from 'proton-shared/lib/interfaces/calendar';

import MainContainer from '../containers/calendar/MainContainer';
import locales from '../locales';

const EVENT_MODELS = [
    UserModel,
    UserSettingsModel,
    MailSettingsModel,
    CalendarsModel,
    CalendarUserSettingsModel,
    AddressesModel,
];

const PRELOAD_MODELS = [UserModel, UserSettingsModel, MailSettingsModel, AddressesModel];

interface Props {
    onLogout: () => void;
}
const PrivateApp = ({ onLogout }: Props) => {
    const api = useApi();
    const cache = useCache();

    useAppTitle('', 'ProtonCalendar');

    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={locales}
            onInit={async () => {
                const [calendars] = await loadModels([CalendarsModel], { api, cache });
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

export default PrivateApp;
