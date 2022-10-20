import { useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LoaderPage, LocationErrorBoundary, ModalsChildren, useLoading, useWelcomeFlags } from '@proton/components';
import useTelemetryScreenSize from '@proton/components/hooks/useTelemetryScreenSize';
import noop from '@proton/utils/noop';

import SignatureIssueModal from '../components/SignatureIssueModal';
import TransferManager from '../components/TransferManager/TransferManager';
import DriveWindow from '../components/layout/DriveWindow';
import GiftFloatingButton from '../components/onboarding/GiftFloatingButton';
import ConflictModal from '../components/uploads/ConflictModal';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import { DriveProvider, useDefaultShare, useDriveEventManager, useSearchControl } from '../store';
import DriveStartupModals from './DriveStartupModals';
import FolderContainer from './FolderContainer';
import OnboardingContainer from './OnboardingContainer';
import { SearchContainer } from './SearchContainer';
import SharedURLsContainer from './SharedLinksContainer';
import TrashContainer from './TrashContainer';

// Empty shared root for blurred container.
const DEFAULT_SHARE_VALUE = {
    shareId: '',
    linkId: '',
};

const InitContainer = () => {
    useTelemetryScreenSize();

    const { getDefaultShare } = useDefaultShare();
    const [loading, withLoading] = useLoading(true);
    const [defaultShareRoot, setDefaultShareRoot] = useState<{ shareId: string; linkId: string }>(DEFAULT_SHARE_VALUE);
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const driveEventManager = useDriveEventManager();
    const { searchEnabled } = useSearchControl();

    useEffect(() => {
        const initPromise = getDefaultShare().then(({ shareId, rootLinkId: linkId }) => {
            setDefaultShareRoot({ shareId, linkId });
        });
        withLoading(initPromise).catch(noop);
    }, []);

    useEffect(() => {
        if (
            defaultShareRoot.linkId === DEFAULT_SHARE_VALUE.linkId ||
            defaultShareRoot.shareId === DEFAULT_SHARE_VALUE.shareId
        ) {
            return;
        }

        driveEventManager.subscribeToShare(defaultShareRoot.shareId).catch(console.warn);
        return () => {
            driveEventManager.unsubscribeFromShare(defaultShareRoot.shareId);
        };
    }, [defaultShareRoot.shareId]);

    if (loading) {
        return (
            <>
                <ModalsChildren />
                <LoaderPage />
            </>
        );
    }

    if (!welcomeFlags.isDone) {
        return (
            <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
                <OnboardingContainer onDone={setWelcomeFlagsDone} />
            </ActiveShareProvider>
        );
    }

    return (
        <ActiveShareProvider defaultShareRoot={defaultShareRoot}>
            <DriveStartupModals />
            <ModalsChildren />
            <TransferManager />
            <GiftFloatingButton />
            <DriveWindow>
                <Switch>
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
