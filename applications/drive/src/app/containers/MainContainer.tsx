import React, { useEffect, useState } from 'react';
import { LoaderPage, ModalsChildren, useLoading, useWelcomeFlags } from 'react-components';
import { Switch, Route, Redirect } from 'react-router-dom';
import { noop } from 'proton-shared/lib/helpers/function';

import DriveEventManagerProvider from '../components/DriveEventManager/DriveEventManagerProvider';
import DriveCacheProvider from '../components/DriveCache/DriveCacheProvider';
import DriveFolderProvider from '../components/Drive/DriveFolderProvider';
import { UploadProvider } from '../components/uploads/UploadProvider';
import { DownloadProvider } from '../components/downloads/DownloadProvider';
import TrashContainer from './TrashContainer/TrashContainer';
import DriveContainer from './DriveContainer/DriveContainer';
import TransferManager from '../components/TransferManager/TransferManager';
import FileBrowerLayoutProvider from '../components/FileBrowser/FileBrowserLayoutProvider';
import DriveErrorBoundary from '../components/DriveErrorBoundary';
import useDrive from '../hooks/drive/useDrive';
import { InitStatusCodes } from '../interfaces/volume';
import NoAccessContainer from './NoAccessContainer/NoAccessContainer';
import OnboardingContainer from './OnboardingContainer';

enum ERROR_TYPES {
    STANDARD,
    NO_ACCESS,
    ONBOARDING,
}

const InitContainer = () => {
    const { initDrive } = useDrive();
    const [loading, withLoading] = useLoading(true);
    const [errorType, setErrorType] = useState<ERROR_TYPES>(ERROR_TYPES.STANDARD);
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();

    useEffect(() => {
        const initPromise = initDrive().catch((error) => {
            if (
                error?.data?.Code === InitStatusCodes.NoAccess ||
                error?.data?.Details?.MissingScopes?.includes('drive')
            ) {
                return setErrorType(ERROR_TYPES.NO_ACCESS);
            }
            setErrorType(() => {
                throw error;
            });
        });
        withLoading(initPromise).catch(noop);
    }, []);

    if (loading) {
        return (
            <>
                <ModalsChildren />
                <LoaderPage />
            </>
        );
    }

    if (errorType === ERROR_TYPES.NO_ACCESS) {
        return <NoAccessContainer />;
    }

    if (welcomeFlags.isWelcomeFlow) {
        return <OnboardingContainer onDone={setWelcomeFlagsDone} />;
    }

    return (
        <>
            <ModalsChildren />
            <TransferManager />
            <FileBrowerLayoutProvider>
                <Switch>
                    <Route path="/trash" component={TrashContainer} />
                    <Route path="/" component={DriveContainer} />
                    <Redirect to="/" />
                </Switch>
            </FileBrowerLayoutProvider>
        </>
    );
};

const MainContainer = () => {
    return (
        <DriveErrorBoundary>
            <DriveEventManagerProvider>
                <DriveCacheProvider>
                    <DriveFolderProvider>
                        <UploadProvider>
                            <DownloadProvider>
                                <InitContainer />
                            </DownloadProvider>
                        </UploadProvider>
                    </DriveFolderProvider>
                </DriveCacheProvider>
            </DriveEventManagerProvider>
        </DriveErrorBoundary>
    );
};

export default MainContainer;
