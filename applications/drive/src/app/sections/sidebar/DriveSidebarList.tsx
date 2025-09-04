import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { SidebarList } from '@proton/components';
import { useDrive } from '@proton/drive/index';
import clsx from '@proton/utils/clsx';

import { type ShareWithKey, useDriveSharingFlags, useUserSettings } from '../../store';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { DevicesSidebar } from '../devices/DevicesSidebar';
import { DriveSidebarFolders } from './DriveSidebarFolders/DriveSidebarFolders';
import { DriveSidebarListItem } from './DriveSidebarListItem';
import { DriveSidebarSharedWithMe } from './DriveSidebarSharedWithMe/DriveSidebarSharedWithMe';
import type { SidebarItem } from './hooks/useSidebar.store';
import { useSidebarStore } from './hooks/useSidebar.store';

type DriveSidebarListProps = {
    shareId?: string;
    userShares: ShareWithKey[];
    collapsed: boolean;
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

export const DriveSidebarList = ({ shareId, userShares, collapsed }: DriveSidebarListProps) => {
    const { photosEnabled } = useUserSettings();
    const [sidebarWidth, setSidebarWidth] = useState('100%');

    const { setItem } = useSidebarStore();

    const setSidebarLevel = (level: number) => {
        const extraWidth = Math.floor(level / 7) * 50;
        setSidebarWidth(`${100 + extraWidth}%`);
    };

    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const showSharedWithMeSection = !isDirectSharingDisabled;
    const { drive } = useDrive();
    const [rootFolder, setRootFolder] = useState<SidebarItem>();

    useEffect(() => {
        const loadRootFolder = async () => {
            const maybeRootFolder = await drive.getMyFilesRootFolder();
            const { node } = getNodeEntity(maybeRootFolder);
            const item = {
                parentUid: undefined,
                level: -1,
                uid: node.uid,
                name: node.name,
                isExpanded: false,
                isLoading: false,
                hasLoadedChildren: false,
            };
            setItem(item);
            setRootFolder(item);
        };

        loadRootFolder();
    }, []);

    return (
        <SidebarList style={{ width: sidebarWidth, maxWidth: sidebarWidth }}>
            {userShares.map(
                (userShare) =>
                    rootFolder && (
                        <DriveSidebarFolders
                            rootFolder={rootFolder}
                            key={userShare.shareId}
                            shareId={userShare.shareId}
                            linkId={userShare.rootLinkId}
                            collapsed={collapsed}
                        />
                    )
            )}
            <DevicesSidebar collapsed={collapsed} setSidebarLevel={setSidebarLevel} />

            {photosEnabled && (
                <DriveSidebarListItem to="/photos" icon="image" collapsed={collapsed}>
                    <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Photos`}>
                        {c('Link').t`Photos`}
                    </span>
                </DriveSidebarListItem>
            )}

            <DriveSidebarListItem to="/shared-urls" icon="link" shareId={shareId} collapsed={collapsed}>
                <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Shared`}>{c('Link')
                    .t`Shared`}</span>
            </DriveSidebarListItem>

            {showSharedWithMeSection && <DriveSidebarSharedWithMe shareId={shareId} collapsed={collapsed} />}

            <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId} collapsed={collapsed}>
                <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Trash`}>{c('Link')
                    .t`Trash`}</span>
            </DriveSidebarListItem>
        </SidebarList>
    );
};
