import { useMemo } from 'react';

import { c } from 'ttag';

import { Loader } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import FileRecoveryIcon from '../../../components/ResolveLockedVolumes/FileRecovery/FileRecoveryIcon';
import { DriveSidebarListItem } from '../DriveSidebarListItem';
import type { SidebarItem } from '../hooks/useSidebar.store';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { DriveExpandButton } from './DriveExpandButton';

type DriveSidebarFoldersRootProps = {
    shareId: string;
    linkId: string;
    rootFolder: SidebarItem;
    toggleExpand: (uid: string) => Promise<void>;
    collapsed: boolean;
};

export const DriveSidebarFoldersRoot = ({
    shareId,
    linkId,
    rootFolder,
    toggleExpand,
    collapsed,
}: DriveSidebarFoldersRootProps) => {
    const url = `/${shareId}/${LinkURLType.FOLDER}/${linkId}`;
    const { children } = useSidebarStore((state) => ({
        children: state.getChildren(rootFolder.uid),
    }));

    const shouldShowArrow = useMemo(() => children.length || !rootFolder.hasLoadedChildren, [rootFolder]);

    return (
        <DriveSidebarListItem
            key="root"
            to={url}
            icon="inbox"
            shareId={shareId}
            onDoubleClick={() => toggleExpand(rootFolder.uid)}
            collapsed={collapsed}
        >
            <span className={clsx('text-ellipsis', collapsed && 'sr-only')}>{c('Title').t`My files`}</span>
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
