import React, { useEffect } from 'react';
import { Route, Switch, Redirect, withRouter, RouteComponentProps } from 'react-router-dom';
import { StandardPrivateApp, ErrorBoundary, GenericError, LoaderPage } from 'react-components';
import { UserModel, AddressesModel } from 'proton-shared/lib/models';
import { c } from 'ttag';

import DriveContainer from './containers/DriveContainer';
import PrivateLayout from './components/layout/PrivateLayout';
import { DownloadProvider } from './components/downloads/DownloadProvider';
import { openpgpConfig } from './openpgpConfig';
import { UploadProvider } from './components/uploads/UploadProvider';
import DriveResourceProvider from './components/Drive/DriveResourceProvider';
import AppErrorBoundary from './components/AppErrorBoundary';
import PreviewContainer from './containers/PreviewContainer';
import { ResourceURLType } from './constants';

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
            openpgpConfig={openpgpConfig}
            onLogout={onLogout}
            preloadModels={[UserModel, AddressesModel]}
            eventModels={[UserModel, AddressesModel]}
            fallback={<LoaderPage text={c('Info').t`Loading ProtonDrive`} />}
        >
            <ErrorBoundary component={<GenericError className="pt2 h100v" />}>
                <DriveResourceProvider>
                    <UploadProvider>
                        <DownloadProvider>
                            <PrivateLayout>
                                <AppErrorBoundary>
                                    <Switch>
                                        <Route
                                            path={`/drive/:shareId?/:type?/:linkId?`}
                                            exact
                                            component={DriveContainer}
                                        />
                                        <Redirect to="/drive" />
                                    </Switch>

                                    <Route
                                        path={`/drive/:shareId?/${ResourceURLType.FILE}/:linkId?`}
                                        exact
                                        component={PreviewContainer}
                                    />
                                </AppErrorBoundary>
                            </PrivateLayout>
                        </DownloadProvider>
                    </UploadProvider>
                </DriveResourceProvider>
            </ErrorBoundary>
        </StandardPrivateApp>
    );
};

export default withRouter(PrivateApp);
