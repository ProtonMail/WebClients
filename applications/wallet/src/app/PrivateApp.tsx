import { LoaderPage, StandardPrivateApp, useAppTitle, useDrawer } from '@proton/components';
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

const PrivateApp = ({ onLogout, locales }: Props) => {
    const { setShowDrawerSidebar } = useDrawer();

    useAppTitle();

    return (
        <StandardPrivateApp
            locales={locales}
            onLogout={onLogout}
            preloadModels={PRELOAD_MODELS}
            eventModels={EVENT_MODELS}
            loader={<LoaderPage />}
            onInit={() => {
                // TODO: do smth here
            }}
            noModals
            app={getAppContainer}
            onUserSettings={({ HideSidePanel }) => setShowDrawerSidebar(HideSidePanel === DRAWER_VISIBILITY.SHOW)}
        />
    );
};

export default PrivateApp;
