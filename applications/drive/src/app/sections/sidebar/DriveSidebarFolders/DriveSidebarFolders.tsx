import { useEffect, useState } from 'react';

import { getDrive } from '@proton/drive/index';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import type { TreeItemWithChildren } from '@proton/drive/modules/directoryTree';

import { DriveSidebarFoldersRoot } from './DriveSidebarFoldersRoot';
import { DriveSidebarSubfolders } from './DriveSidebarSubfolders';

type DriveSidebarFoldersProps = {
    rootFolder: TreeItemWithChildren;
    toggleExpand: (treeItemId: string) => Promise<void>;
    isExpanded: boolean;
    isCollapsed: boolean;
};

export const DriveSidebarFolders = ({
    rootFolder,
    toggleExpand,
    isExpanded,
    isCollapsed,
}: DriveSidebarFoldersProps) => {
    const children = rootFolder.children ? Object.values(rootFolder.children) : [];
    const [shareId, setShareId] = useState<string | undefined>();
    const rootFolderNodeUid = rootFolder.nodeUid;
    useEffect(() => {
        const getShareId = async () => {
            if (rootFolderNodeUid) {
                const { node } = getNodeEntity(await getDrive().getNode(rootFolderNodeUid));
                setShareId(node.deprecatedShareId);
            }
        };
        void getShareId();
    }, [rootFolderNodeUid]);

    return (
        <>
            <DriveSidebarFoldersRoot
                rootFolder={rootFolder}
                toggleExpand={toggleExpand}
                isExpanded={isExpanded}
                isCollapsed={isCollapsed}
                shareId={shareId}
            />
            {isExpanded && shareId && (
                <DriveSidebarSubfolders
                    key={rootFolder.nodeUid}
                    shareId={shareId}
                    children={children}
                    toggleExpand={toggleExpand}
                    level={0}
                />
            )}
        </>
    );
};
