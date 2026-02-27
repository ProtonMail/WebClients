import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom-v5-compat';

import { useUser } from '@proton/account/user/hooks';
import {
    GlobalLoader,
    GlobalLoaderProvider,
    LoaderPage,
    ModalsChildren,
    SubscriptionModalProvider,
    useApi,
    useDrawerWidth,
} from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { getDrive, getDriveForPhotos, splitNodeUid, useDrive } from '@proton/drive';
import { useLoading } from '@proton/hooks';
import { isPaid } from '@proton/shared/lib/user/helpers';
import useFlag from '@proton/unleash/useFlag';

import { FloatingElements } from '../components/FloatingElements/FloatingElements';
import { TransferManagerLegacy } from '../components/TransferManager/TransferManager';
import DriveWindow from '../components/layout/DriveWindow';
import GiftFloatingButton from '../components/onboarding/GiftFloatingButton';
import config from '../config';
import { useFlagsDriveSDKTransfer } from '../flags/useFlagsDriveSDKTransfer';
import { useRunningFreeUploadTimer } from '../hooks/drive/freeUpload/useRunningFreeUploadTimer';
import { ActiveShareProvider } from '../hooks/drive/useActiveShare';
import { useSearchModule } from '../hooks/search/useSearchModule';
import { useReactRouterNavigationLog } from '../hooks/util/useReactRouterNavigationLog';
import { useRedirectToPublicPage } from '../hooks/util/useRedirectToPublicPage';
import { logging } from '../modules/logging';
import { driveMetrics } from '../modules/metrics';
import { PhotosWithAlbumsContainer } from '../photos/PhotosWithAlbumsContainer';
import { TransferManager } from '../sections/transferManager/TransferManager';
import {
    DriveProvider,
    useActivePing,
    useBookmarksActions,
    useDriveEventManager,
    useSearchControl,
    useUserSettings,
} from '../store';
import { useSanitization } from '../store/_sanitization/useSanitization';
import { useDriveSharingFlags, useShareActions } from '../store/_shares';
import { useShareBackgroundActions } from '../store/_views/useShareBackgroundActions';
import { VolumeTypeForEvents, useVolumesState } from '../store/_volumes';
import { setPublicRedirectSpotlightToPending } from '../utils/publicRedirectSpotlight';
import { getNodeEntity } from '../utils/sdk/getNodeEntity';
import { dateToLegacyTimestamp } from '../utils/sdk/legacyTime';
import { Features, measureFeaturePerformance } from '../utils/telemetry';
import { getTokenFromSearchParams } from '../utils/url/token';
import DevicesContainer from './DevicesContainer';
import { FileContainer } from './FileContainer';
import { FolderContainer } from './FolderContainer';
import LocationErrorBoundary from './LocationErrorBoundary';
import NoAccessContainer from './NoAccessContainer';
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
    createTime: number | undefined;
} = {
    volumeId: undefined,
    shareId: undefined,
    linkId: undefined,
    createTime: undefined,
};

function InitContainer() {
    const api = useApi();
    const { migrateShares } = useShareActions();
    const { restoreHashKey } = useSanitization();
    const { setVolumeShareIds } = useVolumesState();
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
    const { photosEnabled } = useUserSettings();
    const drawerWidth = useDrawerWidth();
    const driveWebASVEnabled = useFlag('DriveWebRecoveryASV');

    // Bootstrap search module.
    useSearchModule();

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

                const drive = getDrive();
                const photos = getDriveForPhotos();
                const { node } = await drive.getMyFilesRootFolder().then(getNodeEntity);
                const { node: photosNode } = await photos.getMyPhotosRootFolder().then(getNodeEntity);
                const { volumeId, nodeId } = splitNodeUid(node.uid);
                const { volumeId: photosVolumeId } = splitNodeUid(photosNode.uid);
                setDefaultShareRoot({
                    volumeId,
                    shareId: node.deprecatedShareId,
                    linkId: nodeId,
                    createTime: dateToLegacyTimestamp(node.creationTime),
                });
                if (node.deprecatedShareId) {
                    setVolumeShareIds(volumeId, [node.deprecatedShareId]);
                }
                if (photosNode.deprecatedShareId) {
                    setVolumeShareIds(photosVolumeId, [photosNode.deprecatedShareId]);
                }

                void migrateShares();

                if (driveWebASVEnabled) {
                    void restoreHashKey();
                }
            } catch (err) {
                setError(err as unknown as Error);
                cleanupUrl();
            }
        };

        const feature = measureFeaturePerformance(api, Features.driveBootstrap);
        feature.start();
        void withLoading(
            initPromise().finally(() => {
                feature.end();
            })
        );

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
        const callbackId = driveEventManager.eventHandlers.register((_volumeId, events, processedEventCounter) =>
            convertExternalInvitationsFromEvents(events, processedEventCounter)
        );
        return () => {
            driveEventManager.eventHandlers.unregister(callbackId);
        };
    }, []);

    const isForPhotos = window.location.pathname.includes('/photos');
    const isSDKTransferEnabled = useFlagsDriveSDKTransfer({ isForPhotos });
    const freeUploadOverModal = useRunningFreeUploadTimer(defaultShareRoot.createTime);

    if (loading) {
        return (
            <>
                <ModalsChildren />
                <LoaderPage />
            </>
        );
    }

    if (error || !defaultShareRoot.volumeId || !defaultShareRoot.shareId || !defaultShareRoot.linkId) {
        throw error || new Error('Default share failed to be loaded');
    }

    const rootShare = {
        volumeId: defaultShareRoot.volumeId,
        shareId: defaultShareRoot.shareId,
        linkId: defaultShareRoot.linkId,
    };

    const routes = (
        <>
            <Route path="devices/*" element={<DevicesContainer />} />
            <Route path="trash/*" element={<TrashContainer />} />
            <Route path="no-access/*" element={<NoAccessContainer />} />
            <Route path="shared-urls/*" element={<SharedURLsContainer />} />
            {!isDirectSharingDisabled && <Route path="shared-with-me/*" element={<SharedWithMeContainer />} />}
            {photosEnabled && <Route path="photos/*" element={<PhotosWithAlbumsContainer />} />}
            {searchEnabled && <Route path="search/*" element={<SearchContainer />} />}
            <Route path=":volumeId/:linkId/*" element={<VolumeLinkContainer />} />
            <Route path=":shareId/file/:linkId/*" element={<FileContainer />} />
            <Route path=":shareId/folder/:linkId/*" element={<FolderContainer />} />
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
            <FloatingElements>
                <GiftFloatingButton />
                {!isSDKTransferEnabled && <TransferManagerLegacy />}
                {/* TransferManager will be showed in case we don't have new upload/download */}
                {isSDKTransferEnabled && (
                    <TransferManager drawerWidth={drawerWidth} deprecatedRootShareId={defaultShareRoot.shareId} />
                )}
            </FloatingElements>
            <DriveWindow>
                <Routes>
                    <Route path="/u/:clientId">{routes}</Route>
                    {routes}
                </Routes>
                {freeUploadOverModal}
            </DriveWindow>
        </ActiveShareProvider>
    );
}

const MainContainer: FunctionComponent = () => {
    const location = useLocation();
    const { init } = useDrive();
    const [user] = useUser();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let drive = getDrive();

        const initializeSDK = async () => {
            const userPlan = isPaid(user) ? 'paid' : 'free';
            init({
                appName: config.APP_NAME,
                appVersion: config.APP_VERSION,
                userPlan,
                logging,
                metricHandler: {
                    onEvent: (metric) => driveMetrics.globalErrors.onDriveSDKMetricEvent(metric.event),
                },
            });

            drive = getDrive();
            await drive.getMyFilesRootFolder();

            const photos = getDriveForPhotos();
            await photos.getMyPhotosRootFolder();

            setLoading(false);
        };
        if (!drive) {
            void initializeSDK();
        }
    }, [init, user]);

    if (loading) {
        return <LoaderPage />;
    }
    return (
        <GlobalLoaderProvider>
            <GlobalLoader />
            <LocationErrorBoundary location={location}>
                <DriveProvider>
                    <SubscriptionModalProvider app={config.APP_NAME}>
                        <QuickSettingsRemindersProvider>
                            <InitContainer />
                        </QuickSettingsRemindersProvider>
                    </SubscriptionModalProvider>
                </DriveProvider>
            </LocationErrorBoundary>
        </GlobalLoaderProvider>
    );
};

export default MainContainer;
