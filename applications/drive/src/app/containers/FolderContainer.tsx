import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';

import { Loader, useNotifications } from '@proton/components';
import { NodeType, ValidationError, getDrive, splitNodeUid } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { DriveStartupModals } from '../components/modals/DriveStartupModals';
import type { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import { useActiveShare } from '../hooks/drive/useActiveShare';
import { useLegacyContextShareHandler } from '../hooks/drive/useLegacyContextShareHandler';
import useDriveNavigation from '../hooks/drive/useNavigate';
import { FolderView } from '../sections/folders/FolderView';
import { subscribeToFolderEvents } from '../sections/folders/subscribeToFolderEvents';
import { useFolderStore } from '../sections/folders/useFolder.store';
import { EnrichedError } from '../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../utils/errorHandling/handleSdkError';

export function FolderContainer() {
    const [isLoading, withLoading] = useLoading(true);
    const { navigateToRoot } = useDriveNavigation();
    const { handleContextShare } = useLegacyContextShareHandler();
    const { shareId, linkId } = useParams<DriveSectionRouteProps>();
    const { setFolder } = useActiveShare();
    const [nodeUid, setNodeUid] = useState<string | undefined>();
    const { createNotification } = useNotifications();

    useEffect(() => {
        const abortController = new AbortController();

        const { folder, setIsLoading, reset } = useFolderStore.getState();

        const isNavigatingToNewFolder = !Boolean(
            folder && folder.shareId === shareId && splitNodeUid(folder.uid).nodeId === linkId
        );

        if (isNavigatingToNewFolder) {
            // TODO: Remove this one we have volumeId/linkId in the URL
            // This is to say to the folder that a new node is loading
            reset();
            setIsLoading(true);
        }
        void withLoading(async () => {
            if (!shareId || !linkId) {
                handleSdkError(
                    new EnrichedError('Drive is not initilized, cache has been cleared unexpectedly', {
                        extra: {
                            reason: 'Missing URL parameters',
                        },
                    })
                );
                navigateToRoot();
                return;
            }

            try {
                const uid = await getDrive().getNodeUid(shareId, linkId);
                const { volumeId } = splitNodeUid(uid);
                setFolder({ volumeId, linkId, shareId });
                setNodeUid(uid);
            } catch (err: unknown) {
                if (err instanceof ValidationError && err.code === API_CUSTOM_ERROR_CODES.NOT_ALLOWED) {
                    await handleContextShare(abortController.signal, {
                        shareId,
                        linkId,
                        type: NodeType.Folder,
                    });
                    return;
                }
                console.error(Error.isError(err) ? err.message : 'Unknown issue while retrieving the folder');
                createNotification({
                    type: 'error',
                    text: c('Error').t`We cannot retrieve this item`,
                });
                navigateToRoot();
            }
        });

        return () => {
            abortController.abort();
        };
    }, [shareId, linkId, withLoading, navigateToRoot, setFolder, handleContextShare, createNotification]);

    useEffect(() => {
        const unsubscribe = subscribeToFolderEvents();
        return () => {
            unsubscribe();
        };
    }, []);

    // Should never happened as the routing are asking for them explicitely
    if (!shareId || !linkId) {
        return null;
    }

    if (isLoading && !nodeUid) {
        return <Loader size="medium" className="absolute inset-center" />;
    }

    return (
        <>
            <FolderView shareId={shareId} nodeUid={nodeUid} />
            <DriveStartupModals />
        </>
    );
}
