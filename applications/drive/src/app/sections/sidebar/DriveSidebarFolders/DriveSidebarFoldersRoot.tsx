import { useState } from 'react';

import { c } from 'ttag';

import { Loader } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import FileRecoveryIcon from '../../../components/ResolveLockedVolumes/FileRecovery/FileRecoveryIcon';
import type { TreeItemWithChildren } from '../../../modules/directoryTree';
import { DriveSidebarListItem } from '../DriveSidebarListItem';
import { DriveExpandButton } from './DriveExpandButton';

type DriveSidebarFoldersRootProps = {
    rootFolder: TreeItemWithChildren;
    toggleExpand: (treeItemId: string) => Promise<void>;
    isExpanded: boolean;
    isCollapsed: boolean;
    shareId?: string;
};

export const DriveSidebarFoldersRoot = ({
    rootFolder,
    toggleExpand,
    isExpanded,
    isCollapsed,
    shareId,
}: DriveSidebarFoldersRootProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const { nodeId } = splitNodeUid(rootFolder.nodeUid);
    const url = `/${shareId}/${LinkURLType.FOLDER}/${nodeId}`;
    const shouldShowArrow = !rootFolder.hasLoadedChildren || rootFolder.hasChildren;

    const handleExpand = () => {
        setIsLoading(true);
        void toggleExpand(rootFolder.treeItemId).finally(() => setIsLoading(false));
    };

    return (
        <DriveSidebarListItem
            key="root"
            to={url}
            icon="inbox"
            shareId={shareId}
            onDoubleClick={handleExpand}
            collapsed={isCollapsed}
        >
            <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')}>{c('Title').t`My files`}</span>
            {isLoading ? (
                <Loader className="drive-sidebar--icon inline-flex" />
            ) : (
                shouldShowArrow && (
                    <DriveExpandButton className="shrink-0" expanded={isExpanded} onClick={handleExpand} />
                )
            )}
            <FileRecoveryIcon className="ml-2" />
        </DriveSidebarListItem>
    );
};
