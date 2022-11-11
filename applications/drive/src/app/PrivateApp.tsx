import { LoaderPage, StandardPrivateApp, useProtonMailMigrationRedirect } from '@proton/components';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    AddressesModel,
    ContactEmailsModel,
    ContactsModel,
    LabelsModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';

import UserSettingsProvider from './components/sections/UserSettingsProvider';
import { SettingsProvider, useUserSettings } from './store';

const getAppContainer = () => import('./containers/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateAppInner = ({ onLogout, locales }: Props) => {
    const { loadUserSettings } = useUserSettings();

    useProtonMailMigrationRedirect();

    return (
        <StandardPrivateApp
            locales={locales}
            onLogout={onLogout}
            preloadModels={[UserModel, AddressesModel]}
            eventModels={[UserModel, UserSettingsModel, AddressesModel, ContactsModel, ContactEmailsModel, LabelsModel]}
            fallback={<LoaderPage />}
            onInit={loadUserSettings}
            noModals
            app={getAppContainer}
        />
    );
};

const PrivateApp = (props: Props) => {
    return (
        <UserSettingsProvider>
            <SettingsProvider>
                <PrivateAppInner {...props} />
            </SettingsProvider>
        </UserSettingsProvider>
    );
};

export default PrivateApp;
