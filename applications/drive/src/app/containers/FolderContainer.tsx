import { useEffect, useMemo, useRef, useState } from 'react';
import type { RouteComponentProps } from 'react-router';
import { Route } from 'react-router';

import { useAppTitle } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import noop from '@proton/utils/noop';

import type { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import DriveView from '../components/sections/Drive/DriveView';
import type { DriveFolder } from '../hooks/drive/useActiveShare';
import useActiveShare from '../hooks/drive/useActiveShare';
import { useFolderContainerTitle } from '../hooks/drive/useFolderContainerTitle';
import useNavigate from '../hooks/drive/useNavigate';
import { useDefaultShare, useDriveEventManager } from '../store';
import { VolumeType, useVolumesState } from '../store/_volumes';
import PreviewContainer from './PreviewContainer';

export default function FolderContainer({ match }: RouteComponentProps<DriveSectionRouteProps>) {
    const { navigateToRoot, navigateToNoAccess } = useNavigate();
    const { activeFolder, setFolder } = useActiveShare();
    const volumesState = useVolumesState();
    const lastFolderPromise = useRef<Promise<DriveFolder | undefined>>();
    const [, setError] = useState();
    const { getDefaultShare, isShareAvailable } = useDefaultShare();
    const driveEventManager = useDriveEventManager();

    useFolderContainerTitle({ params: match.params, setAppTitle: useAppTitle });

    const hasValidLinkType = (type: string) => {
        return type === LinkURLType.FILE || type === LinkURLType.FOLDER;
    };

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
            <Route path={`/:shareId?/${LinkURLType.FILE}/:linkId?`} component={PreviewContainer} exact />
        </>
    );
}
