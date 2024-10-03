import { useLinkPath } from '@proton/drive-store/store';
import { useLinks } from '@proton/drive-store/store/_links';
import { useDirectSharingInfo } from '@proton/drive-store/store/_shares/useDirectSharingInfo';
import type { PathItem } from '@proton/drive-store/store/_views/useLinkPath';
import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';

import { useAbortSignal } from '../../store/_views/utils';
import type { DecryptedNode } from './interface';
import { decryptedLinkToNode } from './utils';

export const useNodes = () => {
    const { getLinks } = useLinks();
    const { traverseLinksToRoot } = useLinkPath();
    const { isSharedWithMe } = useDirectSharingInfo();
    const abortSignal = useAbortSignal([]);

    const getNodes = async (ids: { linkId: string; shareId: string }[]): Promise<DecryptedNode[]> => {
        const links = await getLinks(abortSignal, ids);

        return links.map((link) => decryptedLinkToNode(link, link.volumeId));
    };

    const getNodePaths = async (ids: { linkId: string; shareId: string }[]): Promise<PathItem[][]> => {
        const queue = ids.map(
            ({ linkId, shareId }) =>
                async () =>
                    traverseLinksToRoot(abortSignal, shareId, linkId)
        );
        return runInQueue(queue, MAX_THREADS_PER_REQUEST);
    };

    const getNodesAreShared = async (ids: { linkId: string; shareId: string }[]): Promise<boolean[]> => {
        const queue = ids.map(
            ({ shareId }) =>
                async () =>
                    isSharedWithMe(abortSignal, shareId)
        );

        return runInQueue(queue, MAX_THREADS_PER_REQUEST);
    };

    return {
        getNodes,
        getNodePaths,
        getNodesAreShared,
    };
};

export default useNodes;
