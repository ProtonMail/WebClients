import { useEffect, useMemo, useRef, useState } from 'react';
import { RouteComponentProps, Route } from 'react-router';

import { LinkURLType } from '@proton/shared/lib/drive/constants';

import DriveView, { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import useNavigate from '../hooks/drive/useNavigate';
import useActiveShare, { DriveFolder } from '../hooks/drive/useActiveShare';
import PreviewContainer from './PreviewContainer';

const DriveContainer = ({ match }: RouteComponentProps<DriveSectionRouteProps>) => {
    const lastFolderRef = useRef<DriveFolder>();
    const cache = useDriveCache();
    const [, setError] = useState();
    const { navigateToRoot } = useNavigate();
    const { setFolder } = useActiveShare();

    const hasValidLinkType = (type: string) => {
        return type === LinkURLType.FILE || type === LinkURLType.FOLDER;
    };

    const folder = useMemo(() => {
        const { shareId, type, linkId } = match.params;

        if (!shareId && !type && !linkId) {
            const meta = cache.get.defaultShareMeta();

            if (meta) {
                return { shareId: meta.ShareID, linkId: meta.LinkID };
            }
            setError(() => {
                throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
            });
        } else if (!shareId || !hasValidLinkType(type as string) || !linkId) {
            console.warn('Missing parameters, should be none or shareId/type/linkId');
            navigateToRoot();
        } else if (type === LinkURLType.FOLDER) {
            return { shareId, linkId };
        }
        return lastFolderRef.current;
    }, [match.params.shareId, match.params.type, match.params.linkId]);

    useEffect(() => {
        if (folder) {
            setFolder(folder);
        }
    }, [folder]);

    lastFolderRef.current = folder;

    const shouldRenderDriveView = folder?.shareId && folder?.linkId;

    return (
        <>
            {shouldRenderDriveView ? <DriveView /> : null}
            <Route path={`/:shareId?/${LinkURLType.FILE}/:linkId?`} component={PreviewContainer} exact />
        </>
    );
};

export default DriveContainer;
