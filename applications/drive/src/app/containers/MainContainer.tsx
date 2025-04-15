import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom-v5-compat';

import { GlobalLoader, GlobalLoaderProvider, LoaderPage, ModalsChildren, useDrawerWidth } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { useLoading } from '@proton/hooks';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import useFlag from '@proton/unleash/useFlag';

import TransferManager from '../components/TransferManager/TransferManager';
import DriveWindow from '../components/layout/DriveWindow';
import { useAutoRestoreModal } from '../components/modals/AutoRestoreModal';
import GiftFloatingButton from '../components/onboarding/GiftFloatingButton';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import { useReactRouterNavigationLog } from '../hooks/util/useReactRouterNavigationLog';
import { useRedirectToPublicPage } from '../hooks/util/useRedirectToPublicPage';
import { PhotosWithAlbumsContainer } from '../photos/PhotosWithAlbumsContainer';
import {
    DriveProvider,
    useActivePing,
    useBookmarksActions,
    useDefaultShare,
    useDriveEventManager,
    useSearchControl,
    useUserSettings,
} from '../store';
import { useSanitization } from '../store/_sanitization/useSanitization';
import { useDriveSharingFlags, useShareActions } from '../store/_shares';
import { useShareBackgroundActions } from '../store/_views/useShareBackgroundActions';
import { VolumeTypeForEvents } from '../store/_volumes';
import { setPublicRedirectSpotlightToPending } from '../utils/publicRedirectSpotlight';
import { getTokenFromSearchParams } from '../utils/url/token';
import DevicesContainer from './DevicesContainer';
import { FolderContainerWrapper } from './FolderContainer';
import LocationErrorBoundary from './LocationErrorBoundary';
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

const FloatingElements = () => {
    const drawerWidth = useDrawerWidth();
    return (
        <div
            className="flex fixed bottom-0 flex-column z-up w-full items-end right-custom max-w-custom"
            style={{ '--right-custom': `${drawerWidth}px`, '--max-w-custom': '50em' }}
        >
            <GiftFloatingButton />
            <TransferManager />
        </div>
    );
};

const InitContainer = () => {
    const { getDefaultShare, getDefaultPhotosShare } = useDefaultShare();
    const { migrateShares } = useShareActions();
    const { autoRestore, restoreHashKey } = useSanitization();
    const [loading, withLoading] = useLoading(true);
    const [error, setError] = useState<Error>();
    const [defaultShareRoot, setDefaultShareRoot] =
        useState<typeof DEFAULT_VOLUME_INITIAL_STATE>(DEFAULT_VOLUME_INITIAL_STATE);
    const { searchEnabled } = useSearchControl();
    const driveEventManager = useDriveEventManager();
    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const { convertExternalInvitationsFromEvents } = useShareBackgroundActions();
    const bookmarksFeatureDisabled = useFlag('DriveShareURLBookmarksDisabled');
    const { addBookmarkFromPrivateApp } = useBookmarksActions();
    const { redirectionReason, redirectToPublicPage, cleanupUrl } = useRedirectToPublicPage();
    const { photosEnabled, photosWithAlbumsEnabled } = useUserSettings();
    const [autoRestoreModal, showAutoRestoreModal] = useAutoRestoreModal();
    const driveWebASVEnabled = useFlag('DriveWebRecoveryASV');
    useActivePing();
    useReactRouterNavigationLog();
    useEffect(() => {
        const abortController = new AbortController();
        const initPromise = async () => {
            try {
                // In case the user Sign-in from the public page modal, we will redirect him back after we add the file/folder to his bookmarks
                // In case the user Sign-up we just let him in the App (in /shared-with-me route)
                // So we don't even load the app.
                // See useSharedWithMeView.tsx for Sign-up logic
                const token = !bookmarksFeatureDisabled && getTokenFromSearchParams();
                if (token && redirectionReason) {
                    // In case of account switch we need to pass by the private app to set the latest active session
                    if (redirectionReason === 'signin') {
                        await addBookmarkFromPrivateApp(abortController.signal, {
                            token,
                            hideNotifications: true,
                        });
                        setPublicRedirectSpotlightToPending();
                    }
                    redirectToPublicPage(token);
                }

                await getDefaultShare().then(({ shareId, rootLinkId: linkId, volumeId }) =>
                    setDefaultShareRoot({ volumeId, shareId, linkId })
                );

                // This is needed for the usePhotos provider
                // It should load it's own share, but for some reason
                // without this the app crashes and devices fail to decrypt.
                // See DRVWEB-4253
                await getDefaultPhotosShare();

                void migrateShares();

                if (driveWebASVEnabled) {
                    void autoRestore(showAutoRestoreModal);
                    void restoreHashKey();
                }
            } catch (err) {
                setError(err as unknown as Error);
                cleanupUrl();
            }
        };
        void withLoading(initPromise);

        return () => {
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        const { volumeId } = defaultShareRoot;
        if (volumeId === undefined) {
            return;
        }

        driveEventManager.volumes.startSubscription(volumeId, VolumeTypeForEvents.main).catch(console.warn);
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

    const routes = (
        <>
            <Route path="devices/*" element={<DevicesContainer />} />
            <Route path="trash/*" element={<TrashContainer />} />
            <Route path="no-access/*" element={<NoAccessContainer />} />
            <Route path="shared-urls/*" element={<SharedURLsContainer />} />
            {!isDirectSharingDisabled && <Route path="shared-with-me/*" element={<SharedWithMeContainer />} />}
            {photosEnabled && !photosWithAlbumsEnabled && <Route path="photos/*" element={<PhotosContainer />} />}
            {photosEnabled && photosWithAlbumsEnabled && (
                <Route path="photos/*" element={<PhotosWithAlbumsContainer />} />
            )}
            {searchEnabled && <Route path="search/*" element={<SearchContainer />} />}
            <Route path=":volumeId/:linkId/*" element={<VolumeLinkContainer />} />
            <Route path=":shareId/file/:linkId/*" element={<FolderContainerWrapper type={LinkURLType.FILE} />} />
            <Route path=":shareId/folder/:linkId/*" element={<FolderContainerWrapper type={LinkURLType.FOLDER} />} />
            <Route
                path="*"
                element={
                    <Navigate to={`${defaultShareRoot?.shareId}/folder/${defaultShareRoot?.linkId}`} replace={true} />
                }
            />
        </>
    );
    return (
        <ActiveShareProvider defaultShareRoot={rootShare}>
            <ModalsChildren />
            <FloatingElements />
            <DriveWindow>
                <Routes>
                    <Route path="/u/:clientId">{routes}</Route>
                    {routes}
                </Routes>
            </DriveWindow>
            {autoRestoreModal}
        </ActiveShareProvider>
    );
};

const MainContainer: FunctionComponent = () => {
    const location = useLocation();
    return (
        <GlobalLoaderProvider>
            <GlobalLoader />
            <LocationErrorBoundary location={location}>
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
