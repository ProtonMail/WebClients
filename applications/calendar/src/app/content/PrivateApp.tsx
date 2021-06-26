import React from 'react';
import { StandardPrivateApp, LoaderPage, useApi, useCache, useAppTitle } from '@proton/components';
import {
    UserModel,
    UserSettingsModel,
    CalendarsModel,
    CalendarUserSettingsModel,
    AddressesModel,
    MailSettingsModel,
    ContactEmailsModel,
    ContactsModel,
    LabelsModel,
} from '@proton/shared/lib/models';
import { loadModels } from '@proton/shared/lib/models/helper';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

const EVENT_MODELS = [
    UserModel,
    UserSettingsModel,
    MailSettingsModel,
    AddressesModel,
    ContactEmailsModel,
    ContactsModel,
    LabelsModel,
];

const PRELOAD_MODELS = [UserModel, UserSettingsModel, AddressesModel];

const getAppContainer = () => import('../containers/calendar/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}
const PrivateApp = ({ onLogout, locales }: Props) => {
    const api = useApi();
    const cache = useCache();

    useAppTitle('');

    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={locales}
            onInit={async () => {
                const [calendars] = await loadModels([CalendarsModel, AddressesModel], { api, cache });
                if (calendars?.length) {
                    await loadModels([CalendarUserSettingsModel], { api, cache });
                }
            }}
            preloadModels={PRELOAD_MODELS}
            eventModels={EVENT_MODELS}
            fallback={<LoaderPage />}
            hasPrivateMemberKeyGeneration
            hasReadableMemberKeyActivation
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
