import React from 'react';
import { ModalsChildren } from 'react-components';
import { Switch, Route, Redirect } from 'react-router-dom';
import DriveEventManagerProvider from '../components/DriveEventManager/DriveEventManagerProvider';
import DriveCacheProvider from '../components/DriveCache/DriveCacheProvider';
import DriveFolderProvider from '../components/Drive/DriveFolderProvider';
import { UploadProvider } from '../components/uploads/UploadProvider';
import { DownloadProvider } from '../components/downloads/DownloadProvider';
import TrashContainer from './TrashContainer/TrashContainer';
import DriveContainer from './DriveContainer/DriveContainer';
import TransferManager from '../components/TransferManager/TransferManager';

const MainContainer = () => {
    return (
        <DriveEventManagerProvider>
            <DriveCacheProvider>
                <DriveFolderProvider>
                    <UploadProvider>
                        <DownloadProvider>
                            <ModalsChildren />
                            <TransferManager />
                            <Switch>
                                <Route path="/trash" component={TrashContainer} />
                                <Route path="/" component={DriveContainer} />
                                <Redirect to="/" />
                            </Switch>
                        </DownloadProvider>
                    </UploadProvider>
                </DriveFolderProvider>
            </DriveCacheProvider>
        </DriveEventManagerProvider>
    );
};

export default MainContainer;
