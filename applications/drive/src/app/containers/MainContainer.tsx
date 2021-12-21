import { useEffect, useState } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import {
    LoaderPage,
    LocationErrorBoundary,
    ModalsChildren,
    useLoading,
    useWelcomeFlags,
    useEarlyAccess,
} from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import useDrive from '../hooks/drive/useDrive';
import DriveEventManagerProvider from '../components/DriveEventManager/DriveEventManagerProvider';
import DriveCacheProvider from '../components/DriveCache/DriveCacheProvider';
import { UploadProvider } from '../components/uploads/UploadProvider';
import { DownloadProvider } from '../components/downloads/DownloadProvider';
import { ThumbnailsDownloadProvider } from '../components/downloads/ThumbnailDownloadProvider';
import TransferManager from '../components/TransferManager/TransferManager';
import DriveWindow from '../components/layout/DriveWindow';
import DriveContainer from './DriveContainer';
import NoAccessContainer from './NoAccessContainer';
import OnboardingContainer from './OnboardingContainer';
import SharedURLsContainer from './SharedLinksContainer';
import TrashContainer from './TrashContainer';

enum ERROR_TYPES {
    STANDARD,
    NO_ACCESS,
    ONBOARDING,
}

// Empty shared root for blurred container.
const DEFAULT_SHARE_VALUE = {
    shareId: '',
    linkId: '',
};

const InitContainer = () => {
    const { initDrive } = useDrive();
    const [loading, withLoading] = useLoading(true);
    const [defaultShareRoot, setDefaultShareRoot] = useState<{ shareId: string; linkId: string }>(DEFAULT_SHARE_VALUE);
    const [errorType, setErrorType] = useState<ERROR_TYPES>(ERROR_TYPES.STANDARD);
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const earlyAccess = useEarlyAccess();

    useEffect(() => {
        const initPromise = initDrive()
            .then((defaultShareMeta) => {
                setDefaultShareRoot({
                    shareId: defaultShareMeta.ShareID,
                    linkId: defaultShareMeta.LinkID,
                });
            })
            .catch((error) => {
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
        return (
            <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
                <NoAccessContainer reason="notpaid" />
            </ActiveShareProvider>
        );
    }

    // user does not have early access.
    if (earlyAccess.value === false) {
        return (
            <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
                <NoAccessContainer reason="notbeta" />
            </ActiveShareProvider>
        );
    }

    if (welcomeFlags.isWelcomeFlow) {
        return (
            <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
                <OnboardingContainer onDone={setWelcomeFlagsDone} />
            </ActiveShareProvider>
        );
    }

    return (
        <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
            <ModalsChildren />
            <TransferManager />
            <DriveWindow>
                <Switch>
                    <Route path="/trash" component={TrashContainer} />
                    <Route path="/shared-urls" component={SharedURLsContainer} />
                    <Route path="/:shareId?/:type/:linkId?" component={DriveContainer} />
                    <Redirect to={`/${defaultShareRoot?.shareId}/folder/${defaultShareRoot?.linkId}`} />
                </Switch>
            </DriveWindow>
        </ActiveShareProvider>
    );
};

const MainContainer = () => {
    return (
        <LocationErrorBoundary>
            <DriveEventManagerProvider>
                <DriveCacheProvider>
                    <UploadProvider>
                        <DownloadProvider>
                            <ThumbnailsDownloadProvider>
                                <InitContainer />
                            </ThumbnailsDownloadProvider>
                        </DownloadProvider>
                    </UploadProvider>
                </DriveCacheProvider>
            </DriveEventManagerProvider>
        </LocationErrorBoundary>
    );
};

export default MainContainer;
