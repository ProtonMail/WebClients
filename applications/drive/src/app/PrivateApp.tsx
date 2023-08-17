import { LoaderPage, StandardPrivateApp, useDrawer } from '@proton/components';
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    AddressesModel,
    ContactEmailsModel,
    ContactsModel,
    LabelsModel,
    MailSettingsModel,
    UserInvitationModel,
    UserModel,
    UserSettingsModel,
} from '@proton/shared/lib/models';

import { UserSettingsProvider, useUserSettings } from './store';

const getAppContainer = () => import(/* webpackChunkName: "MainContainer" */ './containers/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const EVENT_MODELS = [
    UserModel,
    UserSettingsModel,
    AddressesModel,
    ContactsModel,
    ContactEmailsModel,
    LabelsModel,
    MailSettingsModel,
    UserInvitationModel,
];

const PRELOAD_MODELS = [UserModel, AddressesModel];

const PrivateAppInner = ({ onLogout, locales }: Props) => {
    const { loadUserSettings } = useUserSettings();
    const { setShowDrawerSidebar } = useDrawer();

    return (
        <StandardPrivateApp
            locales={locales}
            onLogout={onLogout}
            preloadModels={PRELOAD_MODELS}
            eventModels={EVENT_MODELS}
            loader={<LoaderPage />}
            onInit={loadUserSettings}
            noModals
            app={getAppContainer}
            onUserSettings={({ HideSidePanel }) => setShowDrawerSidebar(HideSidePanel === DRAWER_VISIBILITY.SHOW)}
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
