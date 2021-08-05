import { StandardPrivateApp, LoaderPage, useAppTitle } from '@proton/components';
import {
    UserModel,
    UserSettingsModel,
    AddressesModel,
    ContactsModel,
    ContactEmailsModel,
    LabelsModel,
} from '@proton/shared/lib/models';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { openpgpConfig } from './openpgpConfig';
import useUserSettings from './hooks/drive/useUserSettings';
import UserSettingsProvider from './components/sections/UserSettingsProvider';

const getAppContainer = () => import('./containers/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateAppInner = ({ onLogout, locales }: Props) => {
    const { loadUserSettings } = useUserSettings();
    useAppTitle('');

    return (
        <StandardPrivateApp
            locales={locales}
            openpgpConfig={openpgpConfig}
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
            <PrivateAppInner {...props} />
        </UserSettingsProvider>
    );
};

export default PrivateApp;
