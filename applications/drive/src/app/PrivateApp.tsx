import React from 'react';
import { StandardPrivateApp, ErrorBoundary, GenericError, LoaderPage, useAppTitle } from 'react-components';
import { UserModel, AddressesModel } from 'proton-shared/lib/models';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { openpgpConfig } from './openpgpConfig';
import MainContainer from './containers/MainContainer';

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
            eventModels={[UserModel, AddressesModel]}
            fallback={<LoaderPage />}
            noModals
        >
            <ErrorBoundary component={<GenericError className="pt2 h100v" />}>
                <MainContainer />
            </ErrorBoundary>
        </StandardPrivateApp>
    );
};

export default PrivateApp;
