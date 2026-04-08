import { useEffect, useState } from 'react';

import { getDrive } from '@proton/drive/index';

import type { TreeItemWithChildren } from '../../../modules/directoryTree';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
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

    useEffect(() => {
        const getShareId = async () => {
            if (rootFolder) {
                const { node } = getNodeEntity(await getDrive().getNode(rootFolder.nodeUid));
                setShareId(node.deprecatedShareId);
            }
        };
        void getShareId();
    }, [rootFolder]);

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
