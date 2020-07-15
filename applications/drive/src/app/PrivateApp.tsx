import React, { useEffect } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { StandardPrivateApp, ErrorBoundary, GenericError, LoaderPage } from 'react-components';
import { UserModel, AddressesModel } from 'proton-shared/lib/models';
import { c } from 'ttag';
import locales from './locales';
import { openpgpConfig } from './openpgpConfig';
import MainContainer from './containers/MainContainer';

interface Props extends RouteComponentProps {
    onLogout: () => void;
}

const PrivateApp = ({ onLogout, history }: Props) => {
    useEffect(() => {
        // Reset URL after logout
        return () => {
            history.push('/');
        };
    }, []);

    return (
        <StandardPrivateApp
            locales={locales}
            openpgpConfig={openpgpConfig}
            onLogout={onLogout}
            preloadModels={[UserModel, AddressesModel]}
            eventModels={[UserModel, AddressesModel]}
            fallback={<LoaderPage text={c('Info').t`Loading ProtonDrive`} />}
            noModals
        >
            <ErrorBoundary component={<GenericError className="pt2 h100v" />}>
                <MainContainer />
            </ErrorBoundary>
        </StandardPrivateApp>
    );
};

export default withRouter(PrivateApp);
