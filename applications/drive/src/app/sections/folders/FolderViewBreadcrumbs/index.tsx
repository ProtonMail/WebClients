import { useEffect } from 'react';

import { splitNodeUid, useDrive } from '@proton/drive/index';

import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { Breadcrumbs } from '../../../statelessComponents/Breadcrumbs/Breadcrumbs';
import { getNodeAncestry } from '../../../utils/sdk/getNodeAncestry';
import { useFolderViewBreadcrumbs } from './useFolderViewBreadcrumbs';

type FolderViewBreadcrumbsProps = {
    nodeUid: string;
    createHandleItemDrop: (newParentUid: string) => (e: React.DragEvent<Element>) => Promise<void>;
};

export const FolderViewBreadcrumbs = ({ nodeUid, createHandleItemDrop }: FolderViewBreadcrumbsProps) => {
    const { drive } = useDrive();
    const { navigateToLink } = useDriveNavigation();

    const { loading, data: crumbs, load } = useFolderViewBreadcrumbs(drive);

    useEffect(() => {
        void load(nodeUid);
    }, [load, nodeUid]);

    return (
        <Breadcrumbs
            loading={loading}
            crumbs={crumbs}
            createHandleItemDrop={createHandleItemDrop}
            events={{
                onBreadcrumbItemClick: async (nodeUid: string) => {
                    // Navigate to the nodeUid node.
                    // TODO: Convert to volume-based navigation instead of deprecated shareId.
                    const { nodeId: targetNodeLinkId } = splitNodeUid(nodeUid);

                    // The shareId is on the top root node; we need to climb from the current node to get it.
                    const ancestry = await getNodeAncestry(nodeUid, drive);
                    if (ancestry.ok && ancestry.value[0] && ancestry.value[0].ok) {
                        const rootNode = ancestry.value[0].value;
                        const rootNodeSharedId = rootNode.deprecatedShareId;
                        if (rootNodeSharedId) {
                            void navigateToLink(rootNodeSharedId, targetNodeLinkId, false /* isFile */);
                        }
                    }
                },
            }}
        />
    );
};
