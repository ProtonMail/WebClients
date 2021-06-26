import React, { useEffect, useState } from 'react';
import {
    LoaderPage,
    LocationErrorBoundary,
    ModalsChildren,
    useLoading,
    useWelcomeFlags,
    useEarlyAccess,
} from 'react-components';
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
import useDrive from '../hooks/drive/useDrive';
import NoAccessContainer from './NoAccessContainer/NoAccessContainer';
import OnboardingContainer from './OnboardingContainer';
import { RESPONSE_CODE } from '../constants';
import SharedURLsContainer from './SharedURLsContainer/SharedURLsContainer';

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
    const earlyAccess = useEarlyAccess();

    useEffect(() => {
        const initPromise = initDrive().catch((error) => {
            if (
                error?.data?.Code === RESPONSE_CODE.NOT_ALLOWED ||
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
        return <NoAccessContainer reason="notpaid" />;
    }

    // isEnabled means global features is enabled, and value whether user has early access.
    if (earlyAccess.isEnabled && earlyAccess.value === false) {
        return <NoAccessContainer reason="notbeta" />;
    }

    if (welcomeFlags.isWelcomeFlow) {
        return <OnboardingContainer onDone={setWelcomeFlagsDone} />;
    }

    return (
        <>
            <ModalsChildren />
            <TransferManager />
            <Switch>
                <Route path="/trash" component={TrashContainer} />
                <Route path="/shared-urls" component={SharedURLsContainer} />
                <Route path="/" component={DriveContainer} />
                <Redirect to="/" />
            </Switch>
        </>
    );
};

const MainContainer = () => {
    return (
        <LocationErrorBoundary>
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
        </LocationErrorBoundary>
    );
};

export default MainContainer;
