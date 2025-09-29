import { useMemo } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import FileRecoveryIcon from '../../../components/ResolveLockedVolumes/FileRecovery/FileRecoveryIcon';
import { DriveSidebarListItem } from '../DriveSidebarListItem';
import type { SidebarItem } from '../hooks/useSidebar.store';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { useSidebarFolders } from '../hooks/useSidebarFolders';
import { DriveExpandButton } from './DriveExpandButton';

type DriveSidebarFoldersRootProps = {
    shareId: string;
    linkId: string;
    rootFolder: SidebarItem;
};

export const DriveSidebarFoldersRoot = ({ shareId, linkId, rootFolder }: DriveSidebarFoldersRootProps) => {
    const { toggleExpand } = useSidebarFolders();

    const url = `/${shareId}/${LinkURLType.FOLDER}/${linkId}`;
    const { children, isCollapsed } = useSidebarStore(
        useShallow((state) => ({
            children: state.getChildren(rootFolder.uid),
            isCollapsed: state.isCollapsed,
        }))
    );

    const shouldShowArrow = useMemo(
        () => children.length || !rootFolder.hasLoadedChildren,
        [children.length, rootFolder.hasLoadedChildren]
    );

    return (
        <DriveSidebarListItem
            key="root"
            to={url}
            icon="inbox"
            shareId={shareId}
            onDoubleClick={() => toggleExpand(rootFolder.uid)}
            collapsed={isCollapsed}
        >
            <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')}>{c('Title').t`My files`}</span>
            {rootFolder.isLoading ? (
                <Loader className="drive-sidebar--icon inline-flex" />
            ) : (
                shouldShowArrow && (
                    <DriveExpandButton
                        className="shrink-0"
                        expanded={rootFolder.isExpanded}
                        onClick={() => toggleExpand(rootFolder.uid)}
                    />
                )
            )}
            <FileRecoveryIcon className="ml-2" />
        </DriveSidebarListItem>
    );
};
