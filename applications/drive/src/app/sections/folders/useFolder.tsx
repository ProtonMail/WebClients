import { useEffect, useState } from 'react';

import type { NodeEntity } from '@proton/drive/index';
import { MemberRole } from '@proton/drive/index';
import { useDrive } from '@proton/drive/index';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { useUserSettings } from '../../store';
import { useControlledSorting, useIsActiveLinkReadOnly } from '../../store/_views/utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getNodeRole } from '../../utils/sdk/getNodeRole';
import type { LegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';

/**
 * useFolder provides data for folder view (file browser of folder).
 */
export function useFolder(folderNodeUid: string, folderShareId: string) {
    const [isLoading, setIsLoading] = useState(true);
    const [nodes, setNodes] = useState<NodeEntity[]>([]);
    const [folder, setFolder] = useState<NodeEntity>();
    const [unsortedLegacyItems, setUnsortedLegacyItems] = useState<LegacyItem[]>([]);
    const { drive } = useDrive();
    const { handleError } = useSdkErrorHandler();
    const { activeFolder } = useActiveShare();
    const [error, setError] = useState<EnrichedError | null>(null);
    const [role, setRole] = useState<MemberRole>(MemberRole.Viewer);

    /**
     * TODO:WIP do i get these data from the sdk already?
     * isReadOnly: Role === Viewer
     * isRoot: !hasParent
     * consider adding "canShare", "canEdit", "canUpload" instead
     */
    const {
        isReadOnly: isActiveLinkReadOnly,
        isRoot: isActiveLinkRoot,
        isInDeviceShare: isActiveLinkInDeviceShare,
        isLoading: isActiveLinkTypeLoading,
    } = useIsActiveLinkReadOnly();

    const { layout, sort, changeSort } = useUserSettings();
    const {
        sortedList: sortedLegacyItems,
        sortParams,
        setSorting,
    } = useControlledSorting(unsortedLegacyItems, sort, changeSort);

    useEffect(() => {
        const ac = new AbortController();
        const fetch = async () => {
            setIsLoading(true);
            try {
                const { node } = getNodeEntity(await drive.getNode(folderNodeUid));

                // TODO:WIP maybe use a reducer instead?
                setRole(await getNodeRole(node, drive));
                setFolder(node);
                setUnsortedLegacyItems([]);
                setNodes([]);
                setError(null);

                for await (const maybeNode of drive.iterateFolderChildren(folderNodeUid, ac.signal)) {
                    const { node } = getNodeEntity(maybeNode);
                    if (node) {
                        const legacyItem = await mapNodeToLegacyItem(maybeNode, folderShareId, drive);
                        setUnsortedLegacyItems((rest) => [...rest, legacyItem]);
                        setNodes((rest) => [...rest, node]);
                    }
                    if (!maybeNode.ok) {
                        /**
                         * TODO:WIP
                         * are we interested in tracking every single node erroring?
                         */
                        handleError(maybeNode.error);
                    }
                }
            } catch (e) {
                handleError(e);
                const message = typeof e === 'string' ? e : (e as Error)?.message || 'Unknown error';
                setError(new EnrichedError(message, { tags: { component: 'drive-sdk' }, extra: { e } }));
            }
            setIsLoading(false);
        };
        void fetch();
        return () => {
            ac.abort();
        };
    }, [folderNodeUid]);

    return {
        isLoading: isLoading || isActiveLinkTypeLoading,
        nodes,
        // TODO:WIP consider renaming
        legacyItems: sortedLegacyItems,
        activeFolder,
        layout,
        sortParams,
        setSorting,
        folderName: folder?.name,
        error,
        role,
        isActiveLinkReadOnly,
        isActiveLinkRoot,
        isActiveLinkInDeviceShare,
    };
}
