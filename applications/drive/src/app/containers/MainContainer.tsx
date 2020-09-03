import React from 'react';
import { ModalsChildren, useSubscription } from 'react-components';
import { Switch, Route, Redirect } from 'react-router-dom';
import { Subscription } from 'proton-shared/lib/interfaces';
import { hasVisionary } from 'proton-shared/lib/helpers/subscription';
import DriveEventManagerProvider from '../components/DriveEventManager/DriveEventManagerProvider';
import DriveCacheProvider from '../components/DriveCache/DriveCacheProvider';
import DriveFolderProvider from '../components/Drive/DriveFolderProvider';
import { UploadProvider } from '../components/uploads/UploadProvider';
import { DownloadProvider } from '../components/downloads/DownloadProvider';
import TrashContainer from './TrashContainer/TrashContainer';
import DriveContainer from './DriveContainer/DriveContainer';
import TransferManager from '../components/TransferManager/TransferManager';
import NoAccessContainer from './NoAccessContainer/NoAccessContainer';
import FileBrowerLayoutProvider from '../components/FileBrowser/FileBrowserLayoutProvider';

const MainContainer = () => {
    const [subscription]: [Subscription, any, any] = useSubscription();

    if (!subscription || !hasVisionary(subscription)) {
        return (
            <>
                <ModalsChildren />
                <NoAccessContainer />
            </>
        );
    }

    return (
        <DriveEventManagerProvider>
            <DriveCacheProvider>
                <DriveFolderProvider>
                    <UploadProvider>
                        <DownloadProvider>
                            <ModalsChildren />
                            <TransferManager />
                            <FileBrowerLayoutProvider>
                                <Switch>
                                    <Route path="/trash" component={TrashContainer} />
                                    <Route path="/" component={DriveContainer} />
                                    <Redirect to="/" />
                                </Switch>
                            </FileBrowerLayoutProvider>
                        </DownloadProvider>
                    </UploadProvider>
                </DriveFolderProvider>
            </DriveCacheProvider>
        </DriveEventManagerProvider>
    );
};

export default MainContainer;
