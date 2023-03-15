import { useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LoaderPage, LocationErrorBoundary, ModalsChildren, useLoading, useWelcomeFlags } from '@proton/components';
import useTelemetryScreenSize from '@proton/components/hooks/useTelemetryScreenSize';

import SignatureIssueModal from '../components/SignatureIssueModal';
import TransferManager from '../components/TransferManager/TransferManager';
import DriveWindow from '../components/layout/DriveWindow';
import GiftFloatingButton from '../components/onboarding/GiftFloatingButton';
import ConflictModal from '../components/uploads/ConflictModal';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import { DriveProvider, useDefaultShare, useDriveEventManager, useSearchControl } from '../store';
import DevicesContainer from './DevicesContainer';
import DriveStartupModals from './DriveStartupModals';
import FolderContainer from './FolderContainer';
import OnboardingContainer from './OnboardingContainer';
import { SearchContainer } from './SearchContainer';
import SharedURLsContainer from './SharedLinksContainer';
import TrashContainer from './TrashContainer';

// Empty shared root for blurred container.
const DEFAULT_VOLUME_INITIAL_STATE: {
    volumeId: string | undefined;
    shareId: string | undefined;
    linkId: string | undefined;
} = {
    volumeId: undefined,
    shareId: undefined,
    linkId: undefined,
};

const InitContainer = () => {
    useTelemetryScreenSize();

    const { getDefaultShare } = useDefaultShare();
    const [loading, withLoading] = useLoading(true);
    const [defaultShareRoot, setDefaultShareRoot] =
        useState<typeof DEFAULT_VOLUME_INITIAL_STATE>(DEFAULT_VOLUME_INITIAL_STATE);
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const { searchEnabled } = useSearchControl();
    const driveEventManager = useDriveEventManager();

    useEffect(() => {
        const initPromise = getDefaultShare().then(({ shareId, rootLinkId: linkId, volumeId }) => {
            setDefaultShareRoot({ volumeId, shareId, linkId });
        });
        withLoading(initPromise);
    }, []);

    useEffect(() => {
        const { volumeId } = defaultShareRoot;
        if (volumeId === undefined) {
            return;
        }

        driveEventManager.volumes.startSubscription(volumeId).catch(console.warn);
        return () => {
            driveEventManager.volumes.unsubscribe(volumeId);
        };
    }, [defaultShareRoot.volumeId]);

    if (loading) {
        return (
            <>
                <ModalsChildren />
                <LoaderPage />
            </>
        );
    }

    // Presence of shareId/linkId is guaranteed by loading flag
    const rootShare = { shareId: defaultShareRoot.shareId!, linkId: defaultShareRoot.linkId! };

    if (!welcomeFlags.isDone) {
        return (
            <ActiveShareProvider defaultShareRoot={rootShare}>
                <OnboardingContainer onDone={setWelcomeFlagsDone} />
            </ActiveShareProvider>
        );
    }

    return (
        <ActiveShareProvider defaultShareRoot={rootShare}>
            <DriveStartupModals />
            <ModalsChildren />
            <TransferManager />
            <GiftFloatingButton />
            <DriveWindow>
                <Switch>
                    <Route path="/devices" component={DevicesContainer} />
                    <Route path="/trash" component={TrashContainer} />
                    <Route path="/shared-urls" component={SharedURLsContainer} />
                    {searchEnabled && <Route path="/search" component={SearchContainer} />}
                    <Route path="/:shareId?/:type/:linkId?" component={FolderContainer} />
                    <Redirect to={`/${defaultShareRoot?.shareId}/folder/${defaultShareRoot?.linkId}`} />
                </Switch>
            </DriveWindow>
        </ActiveShareProvider>
    );
};

const MainContainer = () => {
    return (
        <LocationErrorBoundary>
            <DriveProvider DownloadSignatureIssueModal={SignatureIssueModal} UploadConflictModal={ConflictModal}>
                <InitContainer />
            </DriveProvider>
        </LocationErrorBoundary>
    );
};

export default MainContainer;
