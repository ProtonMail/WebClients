import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, RouteComponentProps } from 'react-router';

import { useAppTitle } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';

import DriveView, { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import useActiveShare, { DriveFolder } from '../hooks/drive/useActiveShare';
import { useFolderContainerTitle } from '../hooks/drive/useFolderContainerTitle';
import useNavigate from '../hooks/drive/useNavigate';
import { useDefaultShare, useDriveEventManager } from '../store';
import { sendErrorReport } from '../utils/errorHandling';
import PreviewContainer from './PreviewContainer';

export default function FolderContainer({ match }: RouteComponentProps<DriveSectionRouteProps>) {
    const { navigateToRoot } = useNavigate();
    const { activeFolder, setFolder } = useActiveShare();
    const lastFolderPromise = useRef<Promise<DriveFolder | undefined>>();
    const [, setError] = useState();
    const { getDefaultShare, isShareAvailable } = useDefaultShare();
    useFolderContainerTitle({ params: match.params, setAppTitle: useAppTitle });
    const events = useDriveEventManager();

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
                navigateToRoot();
            });
    }, [folderPromise]);

    // In case we open preview, folder doesn't need to change.
    lastFolderPromise.current = folderPromise;

    const shouldRenderDriveView = Boolean(activeFolder.shareId && activeFolder.linkId);

    useEffect(() => {
        events.shares.startSubscription(activeFolder.shareId).catch(sendErrorReport);

        return () => {
            events.shares.pauseSubscription(activeFolder.shareId);
        };
    }, [activeFolder.shareId]);

    return (
        <>
            {shouldRenderDriveView ? <DriveView /> : null}
            <Route path={`/:shareId?/${LinkURLType.FILE}/:linkId?`} component={PreviewContainer} exact />
        </>
    );
}
