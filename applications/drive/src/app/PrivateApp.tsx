import React from 'react';
import { StandardPrivateApp, LoaderPage, useAppTitle } from 'react-components';
import { UserModel, UserSettingsModel, AddressesModel } from 'proton-shared/lib/models';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { openpgpConfig } from './openpgpConfig';

const getAppContainer = () => import('./containers/MainContainer');

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}
const PrivateApp = ({ onLogout, locales }: Props) => {
    useAppTitle('');

    return (
        <StandardPrivateApp
            locales={locales}
            openpgpConfig={openpgpConfig}
            onLogout={onLogout}
            preloadModels={[UserModel, AddressesModel]}
            eventModels={[UserModel, UserSettingsModel, AddressesModel]}
            fallback={<LoaderPage />}
            noModals
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
