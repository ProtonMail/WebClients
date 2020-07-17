import React from 'react';
import { ModalsChildren } from 'react-components';
import { Switch, Route, Redirect } from 'react-router-dom';
import DriveEventManagerProvider from '../components/DriveEventManager/DriveEventManagerProvider';
import DriveCacheProvider from '../components/DriveCache/DriveCacheProvider';
import DriveFolderProvider from '../components/Drive/DriveFolderProvider';
import { UploadProvider } from '../components/uploads/UploadProvider';
import { DownloadProvider } from '../components/downloads/DownloadProvider';
import AppErrorBoundary from '../components/AppErrorBoundary';
import TrashContainer from './TrashContainer/TrashContainer';
import DriveContainer from './DriveContainer/DriveContainer';
import PreviewContainer from './PreviewContainer';
import { LinkURLType } from '../constants';
import TransferManager from '../components/TransferManager/TransferManager';

const MainContainer = () => {
    return (
        <DriveEventManagerProvider>
            <DriveCacheProvider>
                <DriveFolderProvider>
                    <UploadProvider>
                        <DownloadProvider>
                            <ModalsChildren />
                            <AppErrorBoundary>
                                <TransferManager />
                                <Switch>
                                    <Route path="/drive/trash" component={TrashContainer} />
                                    <Route path="/drive" component={DriveContainer} />
                                    <Redirect to="/drive" />
                                </Switch>
                                <Route
                                    path={`/drive/:shareId?/${LinkURLType.FILE}/:linkId?`}
                                    component={PreviewContainer}
                                    exact
                                />
                            </AppErrorBoundary>
                        </DownloadProvider>
                    </UploadProvider>
                </DriveFolderProvider>
            </DriveCacheProvider>
        </DriveEventManagerProvider>
    );
};

export default MainContainer;
