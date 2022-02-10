import { useEffect, useMemo, useRef, useState } from 'react';
import { RouteComponentProps, Route } from 'react-router';

import { LinkURLType } from '@proton/shared/lib/drive/constants';

import DriveView, { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import useNavigate from '../hooks/drive/useNavigate';
import useActiveShare, { DriveFolder } from '../hooks/drive/useActiveShare';
import PreviewContainer from './PreviewContainer';

import { useDefaultShare } from '../store';

export default function FolderContainer({ match }: RouteComponentProps<DriveSectionRouteProps>) {
    const { navigateToRoot } = useNavigate();
    const { activeFolder, setFolder } = useActiveShare();
    const lastFolderPromise = useRef<Promise<DriveFolder | undefined>>();
    const [, setError] = useState();
    const { getDefaultShare } = useDefaultShare();

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
            .catch(console.warn);
    }, [folderPromise]);

    // In case we open preview, folder doesn't need to change.
    lastFolderPromise.current = folderPromise;

    const shouldRenderDriveView = activeFolder.shareId && activeFolder.linkId;

    return (
        <>
            {shouldRenderDriveView ? <DriveView /> : null}
            <Route path={`/:shareId?/${LinkURLType.FILE}/:linkId?`} component={PreviewContainer} exact />
        </>
    );
}
