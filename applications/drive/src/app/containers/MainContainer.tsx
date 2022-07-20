import { useEffect, useState } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import { LoaderPage, LocationErrorBoundary, ModalsChildren, useLoading, useWelcomeFlags } from '@proton/components';
import noop from '@proton/utils/noop';

import { DriveProvider, useDriveEventManager, useDefaultShare, useSearchControl } from '../store';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import TransferManager from '../components/TransferManager/TransferManager';
import ConflictModal from '../components/uploads/ConflictModal';
import SignatureIssueModal from '../components/SignatureIssueModal';
import DriveWindow from '../components/layout/DriveWindow';
import FolderContainer from './FolderContainer';
import OnboardingContainer from './OnboardingContainer';
import SharedURLsContainer from './SharedLinksContainer';
import TrashContainer from './TrashContainer';
import { SearchContainer } from './SearchContainer';
import DriveStartupModals from './DriveStartupModals';

// Empty shared root for blurred container.
const DEFAULT_SHARE_VALUE = {
    shareId: '',
    linkId: '',
};

const InitContainer = () => {
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

    if (welcomeFlags.isWelcomeFlow) {
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
