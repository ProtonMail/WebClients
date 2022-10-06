import { LoaderPage, StandardPrivateApp, useDrawer } from '@proton/components';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    AddressesModel,
    ContactEmailsModel,
    ContactsModel,
    LabelsModel,
    MailSettingsModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';

import UserSettingsProvider from './components/sections/UserSettingsProvider';
import { SettingsProvider, useUserSettings } from './store';

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ './containers/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateAppInner = ({ onLogout, locales }: Props) => {
    const { loadUserSettings } = useUserSettings();

    const { setShowDrawerSidebar } = useDrawer();

    return (
        <StandardPrivateApp
            locales={locales}
            onLogout={onLogout}
            preloadModels={[UserModel, AddressesModel]}
            eventModels={[
                UserModel,
                UserSettingsModel,
                AddressesModel,
                ContactsModel,
                ContactEmailsModel,
                LabelsModel,
                MailSettingsModel,
            ]}
            fallback={<LoaderPage />}
            onInit={loadUserSettings}
            onUserSettings={({ HideSidePanel }) => setShowDrawerSidebar(HideSidePanel === DRAWER_VISIBILITY.SHOW)}
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
