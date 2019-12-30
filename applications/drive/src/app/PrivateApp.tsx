import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { ErrorBoundary, StandardPrivateApp, GenericError } from 'react-components';
import { UserModel, AddressesModel } from 'proton-shared/lib/models';

import DriveContainer from './containers/DriveContainer';
import PrivateLayout from './components/layout/PrivateLayout';
import { DownloadProvider } from './components/downloads/DownloadProvider';
import { openpgpConfig } from './openpgpConfig';
import { UploadProvider } from './components/uploads/UploadProvider';
import DriveResourceProvider from './components/DriveResourceProvider';

interface Props {
    onLogout: () => void;
}

const PrivateApp = ({ onLogout }: Props) => {
    return (
        <StandardPrivateApp
            openpgpConfig={openpgpConfig}
            onLogout={onLogout}
            preloadModels={[UserModel, AddressesModel]}
            eventModels={[UserModel, AddressesModel]}
        >
            <DriveResourceProvider>
                <UploadProvider>
                    <DownloadProvider>
                        <PrivateLayout>
                            <Route
                                render={({ location }) => (
                                    <ErrorBoundary
                                        key={location.key}
                                        component={
                                            <div className="p2 main-area">
                                                <GenericError />
                                            </div>
                                        }
                                    >
                                        <Switch>
                                            <Route
                                                path="/drive/:shareId?/:type?/:linkId?"
                                                exact
                                                component={DriveContainer}
                                            />
                                            <Redirect to="/drive" />
                                        </Switch>
                                    </ErrorBoundary>
                                )}
                            />
                        </PrivateLayout>
                    </DownloadProvider>
                </UploadProvider>
            </DriveResourceProvider>
        </StandardPrivateApp>
    );
};

export default PrivateApp;
