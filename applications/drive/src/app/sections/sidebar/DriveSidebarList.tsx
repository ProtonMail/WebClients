import { useMemo } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { SidebarList } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { type ShareWithKey, useDriveSharingFlags, useUserSettings } from '../../store';
import { DevicesSidebar } from '../devices/DevicesSidebar';
import { DriveSidebarFolders } from './DriveSidebarFolders/DriveSidebarFolders';
import { DriveSidebarListItem } from './DriveSidebarListItem';
import { DriveSidebarSharedWithMe } from './DriveSidebarSharedWithMe/DriveSidebarSharedWithMe';
import { useSidebarStore } from './hooks/useSidebar.store';

type DriveSidebarListProps = {
    shareId?: string;
    userShares: ShareWithKey[];
};

export type TreeNodeItem = {
    uid: string;
    name: string;
    isExpanded: boolean;
    children: string[];
    isLoading: boolean;
};

export type SimpleNode = {
    uid: string;
    name: string;
};

export const DriveSidebarList = ({ shareId, userShares }: DriveSidebarListProps) => {
    const { photosEnabled } = useUserSettings();
    const { rootFolder, isCollapsed, sidebarLevel } = useSidebarStore(
        useShallow((state) => ({
            rootFolder: state.getRootFolder(),
            isCollapsed: state.isCollapsed,
            sidebarLevel: state.sidebarLevel,
        }))
    );

    const sidebarWidth = useMemo(() => {
        const extraWidth = Math.floor(sidebarLevel / 7) * 50;
        return `${100 + extraWidth}%`;
    }, [sidebarLevel]);

    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const showSharedWithMeSection = !isDirectSharingDisabled;

    return (
        <SidebarList style={{ width: sidebarWidth, maxWidth: sidebarWidth }}>
            {userShares.map(
                (userShare) =>
                    rootFolder && (
                        <DriveSidebarFolders
                            key={userShare.shareId}
                            rootFolder={rootFolder}
                            shareId={userShare.shareId}
                            linkId={userShare.rootLinkId}
                        />
                    )
            )}
            <DevicesSidebar collapsed={isCollapsed} />

            {photosEnabled && (
                <DriveSidebarListItem to="/photos" icon="image" collapsed={isCollapsed}>
                    <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')} title={c('Link').t`Photos`}>
                        {c('Link').t`Photos`}
                    </span>
                </DriveSidebarListItem>
            )}

            <DriveSidebarListItem to="/shared-urls" icon="link" shareId={shareId} collapsed={isCollapsed}>
                <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')} title={c('Link').t`Shared`}>{c('Link')
                    .t`Shared`}</span>
            </DriveSidebarListItem>

            {showSharedWithMeSection && <DriveSidebarSharedWithMe shareId={shareId} collapsed={isCollapsed} />}

            <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId} collapsed={isCollapsed}>
                <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')} title={c('Link').t`Trash`}>{c('Link')
                    .t`Trash`}</span>
            </DriveSidebarListItem>
        </SidebarList>
    );
};
