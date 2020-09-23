import React from 'react';
import { StandardPrivateApp, LoaderPage, useAppTitle, useApi, useCache } from 'react-components';
import { UserModel, UserSettingsModel, AddressesModel, SubscriptionModel } from 'proton-shared/lib/models';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { loadModels } from 'proton-shared/lib/models/helper';
import { openpgpConfig } from './openpgpConfig';

const getAppContainer = () => import('./containers/MainContainer');

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
            locales={locales}
            openpgpConfig={openpgpConfig}
            onLogout={onLogout}
            preloadModels={[UserModel, AddressesModel]}
            eventModels={[UserModel, UserSettingsModel, AddressesModel]}
            fallback={<LoaderPage />}
            onInit={async () => {
                const [user] = await loadModels([UserModel], { api, cache });
                if (user.isAdmin) {
                    await loadModels([SubscriptionModel], { api, cache });
                }
            }}
            noModals
            app={getAppContainer}
        />
    );
};

export default PrivateApp;
