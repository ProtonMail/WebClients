import React, { useEffect } from 'react';
import { Route, Switch, Redirect, withRouter, RouteComponentProps } from 'react-router-dom';
import { StandardPrivateApp } from 'react-components';
import { UserModel, AddressesModel } from 'proton-shared/lib/models';

import DriveContainer from './containers/DriveContainer';
import PrivateLayout from './components/layout/PrivateLayout';
import { DownloadProvider } from './components/downloads/DownloadProvider';
import { openpgpConfig } from './openpgpConfig';
import { UploadProvider } from './components/uploads/UploadProvider';
import DriveResourceProvider from './components/DriveResourceProvider';
import AppErrorBoundary from './components/AppErrorBoundary';
import PreviewContainer from './containers/PreviewContainer';
import { LinkType } from './interfaces/folder';

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
        >
            <DriveResourceProvider>
                <UploadProvider>
                    <DownloadProvider>
                        <PrivateLayout>
                            <AppErrorBoundary>
                                <Switch>
                                    <Route path={`/drive/:shareId?/:type?/:linkId?`} exact component={DriveContainer} />
                                    <Redirect to="/drive" />
                                </Switch>

                                <Route
                                    path={`/drive/:shareId?/${LinkType.FILE}/:linkId?`}
                                    exact
                                    component={PreviewContainer}
                                />
                            </AppErrorBoundary>
                        </PrivateLayout>
                    </DownloadProvider>
                </UploadProvider>
            </DriveResourceProvider>
        </StandardPrivateApp>
    );
};

export default withRouter(PrivateApp);
