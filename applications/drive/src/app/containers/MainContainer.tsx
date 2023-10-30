import { useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
    GlobalLoader,
    GlobalLoaderProvider,
    LoaderPage,
    LocationErrorBoundary,
    ModalsChildren,
    useWelcomeFlags,
} from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { useLoading } from '@proton/hooks';

import TransferManager from '../components/TransferManager/TransferManager';
import DriveWindow from '../components/layout/DriveWindow';
import DriveStartupModals from '../components/modals/DriveStartupModals';
import GiftFloatingButton from '../components/onboarding/GiftFloatingButton';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import { DriveProvider, useDefaultShare, useDriveEventManager, usePhotosFeatureFlag, useSearchControl } from '../store';
import DevicesContainer from './DevicesContainer';
import FolderContainer from './FolderContainer';
import OnboardingContainer from './OnboardingContainer';
import { PhotosContainer } from './PhotosContainer';
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
    const { getDefaultShare } = useDefaultShare();
    const [loading, withLoading] = useLoading(true);
    const [error, setError] = useState();
    const [defaultShareRoot, setDefaultShareRoot] =
        useState<typeof DEFAULT_VOLUME_INITIAL_STATE>(DEFAULT_VOLUME_INITIAL_STATE);
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const { searchEnabled } = useSearchControl();
    const driveEventManager = useDriveEventManager();
    const isPhotosEnabled = usePhotosFeatureFlag();

    useEffect(() => {
        const initPromise = getDefaultShare()
            .then(({ shareId, rootLinkId: linkId, volumeId }) => {
                setDefaultShareRoot({ volumeId, shareId, linkId });
            })
            .catch((err) => {
                setError(err);
            });
        void withLoading(initPromise);
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

    if (error || !defaultShareRoot.shareId || !defaultShareRoot.linkId) {
        throw error || new Error('Default share failed to be loaded');
    }

    const rootShare = { shareId: defaultShareRoot.shareId, linkId: defaultShareRoot.linkId };

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
                    {isPhotosEnabled && <Route path="/photos" component={PhotosContainer} />}
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
        <GlobalLoaderProvider>
            <GlobalLoader />
            <LocationErrorBoundary>
                <DriveProvider>
                    <QuickSettingsRemindersProvider>
                        <InitContainer />
                    </QuickSettingsRemindersProvider>
                </DriveProvider>
            </LocationErrorBoundary>
        </GlobalLoaderProvider>
    );
};

export default MainContainer;
