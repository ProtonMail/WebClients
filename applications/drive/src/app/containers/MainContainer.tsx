import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
    GlobalLoader,
    GlobalLoaderProvider,
    LoaderPage,
    LocationErrorBoundary,
    ModalsChildren,
} from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { useLoading } from '@proton/hooks';

import TransferManager from '../components/TransferManager/TransferManager';
import DriveWindow from '../components/layout/DriveWindow';
import DriveStartupModals from '../components/modals/DriveStartupModals';
import GiftFloatingButton from '../components/onboarding/GiftFloatingButton';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import {
    DriveProvider,
    useActivePing,
    useDefaultShare,
    useDriveEventManager,
    usePhotosFeatureFlag,
    useSearchControl,
} from '../store';
// TODO: This should be removed after rollout phase
import { useDriveSharingFlags, useShareActions } from '../store/_shares';
import { useShareBackgroundActions } from '../store/_views/useShareBackgroundActions';
import { VolumeType } from '../store/_volumes';
import DevicesContainer from './DevicesContainer';
import FolderContainer from './FolderContainer';
import NoAccessContainer from './NoAccessContainer';
import { PhotosContainer } from './PhotosContainer';
import { SearchContainer } from './SearchContainer';
import SharedURLsContainer from './SharedLinksContainer';
import SharedWithMeContainer from './SharedWithMeContainer';
import TrashContainer from './TrashContainer';
import { VolumeLinkContainer } from './VolumeLinkContainer';

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
    const { getDefaultShare, getDefaultPhotosShare } = useDefaultShare();
    const { migrateShares } = useShareActions();
    const [loading, withLoading] = useLoading(true);
    const [error, setError] = useState();
    const [defaultShareRoot, setDefaultShareRoot] =
        useState<typeof DEFAULT_VOLUME_INITIAL_STATE>(DEFAULT_VOLUME_INITIAL_STATE);
    const { searchEnabled } = useSearchControl();
    const driveEventManager = useDriveEventManager();
    const [hasPhotosShare, setHasPhotosShare] = useState(false);
    const isPhotosEnabled = usePhotosFeatureFlag();
    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const { convertExternalInvitationsFromEvents } = useShareBackgroundActions();

    useActivePing();

    useEffect(() => {
        const initPromise = getDefaultShare()
            .then(({ shareId, rootLinkId: linkId, volumeId }) => {
                setDefaultShareRoot({ volumeId, shareId, linkId });
            })
            // We fetch it after, so we don't make to user share requests
            .then(() => getDefaultPhotosShare().then((photosShare) => setHasPhotosShare(!!photosShare)))
            .then(() => {
                void migrateShares();
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

        driveEventManager.volumes.startSubscription(volumeId, VolumeType.own).catch(console.warn);
        return () => {
            driveEventManager.volumes.unsubscribe(volumeId);
        };
    }, [defaultShareRoot.volumeId]);

    useEffect(() => {
        driveEventManager.eventHandlers.register((_volumeId, events, processedEventCounter) =>
            convertExternalInvitationsFromEvents(events, processedEventCounter)
        );
    }, []);

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
                    <Route path="/no-access" component={NoAccessContainer} />
                    <Route path="/shared-urls" component={SharedURLsContainer} />
                    {!isDirectSharingDisabled && <Route path="/shared-with-me" component={SharedWithMeContainer} />}
                    {(isPhotosEnabled || hasPhotosShare) && <Route path="/photos" component={PhotosContainer} />}
                    {searchEnabled && <Route path="/search" component={SearchContainer} />}
                    <Route path="/:volumeId/:linkId" exact component={VolumeLinkContainer} />
                    <Route path="/:shareId?/:type/:linkId?" component={FolderContainer} />
                    <Redirect to={`/${defaultShareRoot?.shareId}/folder/${defaultShareRoot?.linkId}`} />
                </Switch>
            </DriveWindow>
        </ActiveShareProvider>
    );
};

const MainContainer: FunctionComponent = () => {
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
