import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { Loader } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import DriveStartupModals from '../components/modals/DriveStartupModals';
import type { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import { DriveViewDeprecated } from '../components/sections/Drive/DriveView';
import type { DriveFolder } from '../hooks/drive/useActiveShare';
import { useActiveShare } from '../hooks/drive/useActiveShare';
import { useFolderContainerTitle } from '../hooks/drive/useFolderContainerTitle';
import useDriveNavigation from '../hooks/drive/useNavigate';
import { FolderView } from '../sections/folders/FolderView';
import { useContextShareHandler, useDefaultShare, useDriveEventManager } from '../store';
import { VolumeTypeForEvents, useVolumesState } from '../store/_volumes';
import { getIsPublicContext } from '../utils/getIsPublicContext';
import PreviewContainer from './PreviewContainer';

const hasValidLinkType = (type: string) => {
    return type === LinkURLType.FILE || type === LinkURLType.FOLDER;
};

export default function FolderContainer({ type }: { type: LinkURLType }) {
    const params = useParams<DriveSectionRouteProps>();
    const { shareId, linkId } = params;
    const { navigateToRoot, navigateToNoAccess } = useDriveNavigation();
    const { activeFolder, setFolder } = useActiveShare();
    const volumesState = useVolumesState();
    const lastFolderPromise = useRef<Promise<DriveFolder | undefined>>();
    const [, setError] = useState();
    const { getDefaultShare, isShareAvailable } = useDefaultShare();
    const driveEventManager = useDriveEventManager();
    const useSDK = useFlag('DriveWebSDKFolders');
    const isPublic = getIsPublicContext();
    // TODO:WIP `&& false` needed if we want to merge this code before the work is ready, the FF needs to be enabled locally so we can work on it
    const DriveViewComponent = useSDK && !isPublic && false ? FolderView : DriveViewDeprecated;

    useFolderContainerTitle(
        useMemo(
            () => ({
                shareId: params.shareId || '',
                linkId: params.linkId || '',
                type: params.type,
            }),
            [params.shareId, params.linkId, params.type]
        )
    );

    const folderPromise = useMemo(async () => {
        if (!shareId && !type && !linkId) {
            const defaultShare = await getDefaultShare();
            if (defaultShare) {
                return {
                    volumeId: defaultShare.volumeId,
                    shareId: defaultShare.shareId,
                    linkId: defaultShare.rootLinkId,
                };
            }
            setError(() => {
                // Throwing error in async function does not propagate it to
                // the view. Therefore we need to use this setError hack.
                throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
            });
        } else if (!shareId || !hasValidLinkType(type as string) || !linkId) {
            console.warn('Missing parameters, should be none or shareId/type/linkId', { params });
            navigateToRoot();
        } else if (type === LinkURLType.FOLDER) {
            const ac = new AbortController();
            const share = await isShareAvailable(ac.signal, shareId);

            if (!share) {
                console.warn('Provided share is not available, probably locked or soft deleted');
                navigateToRoot();
                return;
            }
            return { volumeId: share.volumeId, shareId, linkId };
        }
        return lastFolderPromise.current;
    }, [params.linkId, params.shareId, type]);

    useEffect(() => {
        folderPromise
            .then((folder) => {
                if (folder) {
                    setFolder(folder);
                }
            })
            .catch((err) => {
                console.warn(err);
                if (err.data?.Code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
                    navigateToNoAccess();
                } else {
                    navigateToRoot();
                }
            });
    }, [folderPromise]);

    // With sharing we need to subscribe to events from different volumes.
    // This will happen during Shared with me navigation
    useEffect(() => {
        const volumeId = volumesState.findVolumeId(activeFolder.shareId);
        if (!volumeId) {
            return;
        }
        getDefaultShare()
            .then((defaultShare) => {
                // We exclude subscribing to volumes event of main share (Already done in MainContainer)
                if (defaultShare.volumeId !== volumeId) {
                    driveEventManager.volumes.startSubscription(volumeId, VolumeTypeForEvents.shared).catch(noop);
                }
            })
            .catch(noop);

        return () => {
            // This is memoized so should not make another call
            void getDefaultShare().then((defaultShare) => {
                // We exclude pausing subscription to volumes event of main share
                if (defaultShare.volumeId !== volumeId) {
                    driveEventManager.volumes.pauseSubscription(volumeId);
                }
            });
        };
    }, [activeFolder.shareId]);

    // In case we open preview, folder doesn't need to change.
    lastFolderPromise.current = folderPromise;

    const shouldRenderDriveView = Boolean(activeFolder.shareId && activeFolder.linkId);

    return (
        <>
            {shouldRenderDriveView ? <DriveViewComponent /> : null}
            <DriveStartupModals />
            {shareId && linkId && <>{type === LinkURLType.FILE && <PreviewContainer />}</>}
        </>
    );
}

export const FolderContainerWrapper = ({ type }: { type: LinkURLType }) => {
    const { isShareAvailable } = useDefaultShare();
    const [isLoading, withLoading] = useLoading(true);
    const { navigateToRoot } = useDriveNavigation();
    const { handleContextShare } = useContextShareHandler();
    const { shareId, linkId } = useParams<DriveSectionRouteProps>();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(async () => {
            if (!shareId || !linkId || !type || !hasValidLinkType(type)) {
                return;
            }
            await isShareAvailable(abortController.signal, shareId).catch(async (err) => {
                if (err.data?.Code === API_CUSTOM_ERROR_CODES.NOT_ALLOWED) {
                    await handleContextShare(abortController.signal, {
                        shareId,
                        linkId,
                        isFile: type === LinkURLType.FILE,
                    });
                    return;
                }
                console.warn('Provided share is not available, probably locked or soft deleted');
                navigateToRoot();
                return;
            });
        });
        return () => {
            abortController.abort();
        };
    }, [shareId, type, linkId]);

    if (isLoading) {
        return <Loader size="medium" className="absolute inset-center" />;
    }
    return <FolderContainer type={type} />;
};
