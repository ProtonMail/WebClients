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

import { RESPONSE_CODE } from '../constants';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import useDrive from '../hooks/drive/useDrive';
import DriveEventManagerProvider from '../components/DriveEventManager/DriveEventManagerProvider';
import DriveCacheProvider from '../components/DriveCache/DriveCacheProvider';
import { UploadProvider } from '../components/uploads/UploadProvider';
import { DownloadProvider } from '../components/downloads/DownloadProvider';
import { ThumbnailsDownloadProvider } from '../components/downloads/ThumbnailDownloadProvider';
import TransferManager from '../components/TransferManager/TransferManager';
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

const InitContainer = () => {
    const { initDrive } = useDrive();
    const [loading, withLoading] = useLoading(true);
    const [defaultShareRoot, setDefaultShareRoot] = useState<{ shareId: string; linkId: string }>();
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
        <ActiveShareProvider defaultShareRoot={defaultShareRoot as { shareId: string; linkId: string }}>
            <ModalsChildren />
            <TransferManager />
            <Switch>
                <Route path="/trash" component={TrashContainer} />
                <Route path="/shared-with-me" component={SharedURLsContainer} />
                <Route path="/shared-by-me" component={SharedURLsContainer} />
                <Route path="/shared-urls" component={SharedURLsContainer} />
                <Route path="/" component={DriveContainer} />
                <Redirect to="/" />
            </Switch>
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
