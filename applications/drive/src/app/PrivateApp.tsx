import { StandardPrivateApp, LoaderPage } from '@proton/components';
import {
    UserModel,
    UserSettingsModel,
    AddressesModel,
    ContactsModel,
    ContactEmailsModel,
    LabelsModel,
} from '@proton/shared/lib/models';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { useUserSettings, SettingsProvider } from './store';
import UserSettingsProvider from './components/sections/UserSettingsProvider';

const getAppContainer = () => import('./containers/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateAppInner = ({ onLogout, locales }: Props) => {
    const { loadUserSettings } = useUserSettings();

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
