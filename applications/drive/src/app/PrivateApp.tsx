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
import DriveFolderProvider from './components/Drive/DriveFolderProvider';
import AppErrorBoundary from './components/AppErrorBoundary';
import PreviewContainer from './containers/PreviewContainer';
import { LinkURLType } from './constants';
import TrashContainer from './containers/TrashContainer';
import DriveCacheProvider from './components/DriveCache/DriveCacheProvider';
import DriveEventManagerProvider from './components/DriveEventManager/DriveEventManagerProvider';
import UploadDragDrop from './components/uploads/UploadDragDrop/UploadDragDrop';

interface Props extends RouteComponentProps {
    onLogout: () => void;
}

const PrivateApp = ({ onLogout, history, location }: Props) => {
    useEffect(() => {
        // Reset URL after logout
        return () => {
            history.push('/');
        };
    }, []);

    const isPreview = location.pathname.includes(LinkURLType.FILE);

    return (
        <StandardPrivateApp
            openpgpConfig={openpgpConfig}
            onLogout={onLogout}
            preloadModels={[UserModel, AddressesModel]}
            eventModels={[UserModel, AddressesModel]}
            fallback={<LoaderPage text={c('Info').t`Loading ProtonDrive`} />}
        >
            <ErrorBoundary component={<GenericError className="pt2 h100v" />}>
                <DriveEventManagerProvider>
                    <DriveCacheProvider>
                        <DriveFolderProvider>
                            <UploadProvider>
                                <DownloadProvider>
                                    <UploadDragDrop disabled={isPreview}>
                                        <PrivateLayout>
                                            <AppErrorBoundary>
                                                <Switch>
                                                    <Route
                                                        path="/drive/trash/:shareId?"
                                                        exact
                                                        component={TrashContainer}
                                                    />
                                                    <Route
                                                        path={`/drive/:shareId?/:type?/:linkId?`}
                                                        exact
                                                        component={DriveContainer}
                                                    />
                                                    <Redirect to="/drive" />
                                                </Switch>

                                                <Route
                                                    path={`/drive/:shareId?/${LinkURLType.FILE}/:linkId?`}
                                                    exact
                                                    component={PreviewContainer}
                                                />
                                            </AppErrorBoundary>
                                        </PrivateLayout>
                                    </UploadDragDrop>
                                </DownloadProvider>
                            </UploadProvider>
                        </DriveFolderProvider>
                    </DriveCacheProvider>
                </DriveEventManagerProvider>
            </ErrorBoundary>
        </StandardPrivateApp>
    );
};

export default withRouter(PrivateApp);
