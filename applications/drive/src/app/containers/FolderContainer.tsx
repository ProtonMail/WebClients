import { useEffect, useMemo, useRef, useState } from 'react';
import type { RouteComponentProps } from 'react-router';
import { Route } from 'react-router';

import { Loader, useAppTitle } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import noop from '@proton/utils/noop';

import DriveStartupModals from '../components/modals/DriveStartupModals';
import type { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import DriveView from '../components/sections/Drive/DriveView';
import type { DriveFolder } from '../hooks/drive/useActiveShare';
import useActiveShare from '../hooks/drive/useActiveShare';
import { useFolderContainerTitle } from '../hooks/drive/useFolderContainerTitle';
import useNavigate from '../hooks/drive/useNavigate';
import { useContextShareHandler, useDefaultShare, useDriveEventManager } from '../store';
import { VolumeType, useVolumesState } from '../store/_volumes';
import PreviewContainer from './PreviewContainer';

const hasValidLinkType = (type: string) => {
    return type === LinkURLType.FILE || type === LinkURLType.FOLDER;
};

export default function FolderContainer({ match }: RouteComponentProps<DriveSectionRouteProps>) {
    const { navigateToRoot, navigateToNoAccess } = useNavigate();
    const { activeFolder, setFolder } = useActiveShare();
    const volumesState = useVolumesState();
    const lastFolderPromise = useRef<Promise<DriveFolder | undefined>>();
    const [, setError] = useState();
    const { getDefaultShare, isShareAvailable } = useDefaultShare();
    const driveEventManager = useDriveEventManager();

    useFolderContainerTitle({ params: match.params, setAppTitle: useAppTitle });

    const folderPromise = useMemo(async () => {
        const { shareId, type, linkId } = match.params;

        if (!shareId && !type && !linkId) {
            const defaultShare = await getDefaultShare();
            if (defaultShare) {
                return { shareId: defaultShare.shareId, linkId: defaultShare.rootLinkId };
            }
            setError(() => {
                // Throwing error in async function does not propagate it to
                // the view. Therefore we need to use this setError hack.
                throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
            });
        } else if (!shareId || !hasValidLinkType(type as string) || !linkId) {
            console.warn('Missing parameters, should be none or shareId/type/linkId');
            navigateToRoot();
        } else if (type === LinkURLType.FOLDER) {
            const ac = new AbortController();
            const isAvailable = await isShareAvailable(ac.signal, shareId);
            if (!isAvailable) {
                console.warn('Provided share is not available, probably locked or soft deleted');
                navigateToRoot();
                return;
            }
            return { shareId, linkId };
        }
        return lastFolderPromise.current;
    }, [match.params.shareId, match.params.type, match.params.linkId]);

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
                    driveEventManager.volumes.startSubscription(volumeId, VolumeType.shared).catch(noop);
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
            {shouldRenderDriveView ? <DriveView /> : null}
            <DriveStartupModals />
            <Route path={`/:shareId?/${LinkURLType.FILE}/:linkId?`} component={PreviewContainer} exact />
        </>
    );
}

export const FolderConntainerWrapper = ({ match, ...props }: RouteComponentProps<DriveSectionRouteProps>) => {
    const { isShareAvailable } = useDefaultShare();
    const [isLoading, withLoading] = useLoading(true);
    const { navigateToRoot } = useNavigate();
    const { handleContextShare } = useContextShareHandler();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(async () => {
            const { shareId, type, linkId } = match.params;
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
    }, [match.params.shareId, match.params.type, match.params.linkId]);

    if (isLoading) {
        return <Loader size="medium" className="absolute inset-center" />;
    }
    return <FolderContainer match={match} {...props} />;
};
