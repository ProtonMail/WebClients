import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';

import { NodeType, getDrive, splitNodeUid } from '@proton/drive/index';
import generateUID from '@proton/utils/generateUID';

import { toLinkURLType } from '../../components/sections/helpers';
import { sendErrorReport } from '../../utils/errorHandling';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';

interface NavigationEvenListener {
    id: string;
    run: () => void;
}

let listeners: NavigationEvenListener[] = [];

function useDriveNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const drive = getDrive();

    const pushToHistory = (path: string) => {
        navigate(path);
        listeners.forEach((listener) => {
            listener.run();
        });
    };

    const navigateToLink = useCallback(
        (shareId: string, linkId: string, isFile: boolean, rPath?: string) => {
            pushToHistory(`/${shareId}/${toLinkURLType(isFile)}/${linkId}?r=${rPath || location.pathname}`);
        },
        [location.pathname]
    );

    // TODO: Convert to volume-based navigation instead of deprecated shareId.
    const navigateToNodeUid = useCallback(
        async (nodeUid: string, rPath?: string) => {
            const { nodeId: targetNodeLinkId } = splitNodeUid(nodeUid);
            // The shareId is on the top root node; we need to climb from the current node to get it.
            const ancestry = await getNodeAncestry(nodeUid, drive);
            if (!ancestry.ok || !ancestry.value[0]?.ok) {
                sendErrorReport(new Error('[navigateToNodeUid] Failed to resolve node ancestry for navigation'));
                return;
            }

            const rootNodeSharedId = ancestry.value[0].value.deprecatedShareId;
            if (!rootNodeSharedId) {
                sendErrorReport(new Error('[navigateToNodeUid] Root node is missing deprecatedShareId for navigation'));
                return;
            }

            const destinationNode = ancestry.value[ancestry.value.length - 1];
            const isFile = getNodeEntity(destinationNode).node.type === NodeType.File;
            return navigateToLink(rootNodeSharedId, targetNodeLinkId, isFile, rPath);
        },
        [drive, navigateToLink]
    );

    const redirectToLink = useCallback((shareId: string, linkId: string, isFile: boolean) => {
        navigate(`/${shareId}/${toLinkURLType(isFile)}/${linkId}`, { replace: true });
    }, []);

    const navigateToRoot = useCallback(() => {
        pushToHistory('/');
    }, []);

    const navigateToNoAccess = useCallback(() => {
        pushToHistory('/no-access');
    }, []);

    const navigateToSharedByMe = useCallback(() => {
        pushToHistory('/shared-urls');
    }, []);

    const navigateToTrash = useCallback(() => {
        pushToHistory('/trash');
    }, []);

    const navigateToDevices = useCallback(() => {
        pushToHistory('/devices');
    }, []);

    const navigateToSharedWithMe = useCallback(() => {
        pushToHistory('/shared-with-me');
    }, []);

    const navigateToAlbum = useCallback(
        (shareId: string, linkId: string, options?: { openShare?: boolean; addPhotos?: boolean }) => {
            const searchParams = new URLSearchParams();
            if (options?.openShare) {
                searchParams.set('openShare', 'true');
            }

            const queryString = searchParams.toString();
            const url = `/photos/albums/${shareId}/album/${linkId}${options?.addPhotos ? '/add-photos' : ''}${queryString ? `?${queryString}` : ''}`;

            pushToHistory(url);
        },
        []
    );

    const navigateToPhotos = useCallback(() => {
        pushToHistory('/photos');
    }, []);

    const navigateToAlbums = useCallback(() => {
        pushToHistory(`/photos/albums`);
    }, []);

    const navigateToSearch = useCallback((searchTerm: string) => {
        navigate({
            pathname: '/search',
            hash: `q=${searchTerm}`,
        });
    }, []);

    const addListener = (listener: () => void) => {
        const listenerId = generateUID('drive-navigation-event');
        listeners.push({ id: listenerId, run: listener });
        return listenerId;
    };

    const removeListener = (listenerId: string) => {
        listeners = listeners.filter(({ id }) => id !== listenerId);
    };

    return {
        navigateToNodeUid,
        navigateToLink,
        navigateToRoot,
        navigateToNoAccess,
        navigateToSharedByMe,
        navigateToTrash,
        navigateToSearch,
        addListener,
        removeListener,
        navigateToDevices,
        navigateToSharedWithMe,
        redirectToLink,
        navigateToAlbum,
        navigateToPhotos,
        navigateToAlbums,
    };
}

export default useDriveNavigation;
