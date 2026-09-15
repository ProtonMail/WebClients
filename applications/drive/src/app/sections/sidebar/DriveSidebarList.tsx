import { useEffect, useMemo } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, SidebarList } from '@proton/components';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { DirectoryTreeRootType, type directoryTreeFactory } from '@proton/drive/modules/directoryTree';
import { IcImage } from '@proton/icons/icons/IcImage';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useDriveSharingFlags } from '../../legacy/store';
import { DevicesSidebar } from './DriveSidebarDevices/DevicesSidebar';
import { DriveSidebarFolders } from './DriveSidebarFolders/DriveSidebarFolders';
import { DriveSidebarListItem } from './DriveSidebarListItem';
import { DriveSidebarSharedWithMe } from './DriveSidebarSharedWithMe/DriveSidebarSharedWithMe';
import { EasySwitchSidebarSection } from './EasySwitchSidebarSection';
import { useSidebarStore } from './hooks/useSidebar.store';

type DriveSidebarListProps = {
    shareId?: string;
    store: ReturnType<ReturnType<typeof directoryTreeFactory>>;
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

export const DriveSidebarList = ({ shareId, store }: DriveSidebarListProps) => {
    const { treeRoots, initializeTree, toggleExpand, expandedTreeIds } = store;
    const { isCollapsed, sidebarLevel } = useSidebarStore(
        useShallow((state) => ({
            isCollapsed: state.isCollapsed,
            sidebarLevel: state.sidebarLevel,
        }))
    );

    const myFilesRoot = useMemo(() => treeRoots.find((d) => d.type === DirectoryTreeRootType.FilesRoot), [treeRoots]);
    const devicesRoot = useMemo(() => treeRoots.find((d) => d.type === DirectoryTreeRootType.DevicesRoot), [treeRoots]);

    useEffect(() => {
        const initTree = async () => {
            await initializeTree().catch(handleSdkError);
        };
        void initTree();
    }, [initializeTree]);

    const sidebarWidth = useMemo(() => {
        const extraWidth = Math.floor(sidebarLevel / 7) * 50;
        return `${100 + extraWidth}%`;
    }, [sidebarLevel]);

    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const showSharedWithMeSection = !isDirectSharingDisabled;
    const isDriveEasySwitchEnabled = useFlag('EasySwitchB2CForDriveWeb');
    const isEasySwitchNewUIEnabled = useFlag('EasySwitchB2CForDriveWebNewUI') && isDriveEasySwitchEnabled;

    return (
        <SidebarList style={{ width: sidebarWidth, maxWidth: sidebarWidth }}>
            {myFilesRoot ? (
                <DriveSidebarFolders
                    rootFolder={myFilesRoot}
                    toggleExpand={toggleExpand}
                    isExpanded={!!expandedTreeIds.get(myFilesRoot.treeItemId)}
                    isCollapsed={isCollapsed}
                />
            ) : (
                <DriveSidebarListItem to="/" icon={IcInbox} collapsed={isCollapsed}>
                    <span className="text-ellipsis">{c('Title').t`My files`}</span>
                    <Loader className="drive-sidebar--icon inline-flex" />
                </DriveSidebarListItem>
            )}

            {devicesRoot && (
                <DevicesSidebar
                    deviceRoot={devicesRoot}
                    toggleExpand={toggleExpand}
                    isExpanded={!!expandedTreeIds.get(devicesRoot.treeItemId)}
                    isCollapsed={isCollapsed}
                />
            )}

            <DriveSidebarListItem to="/photos" icon={IcImage} collapsed={isCollapsed}>
                <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')} title={c('Link').t`Photos`}>
                    {c('Link').t`Photos`}
                </span>
            </DriveSidebarListItem>

            <DriveSidebarListItem to="/shared-urls" icon={IcLink} shareId={shareId} collapsed={isCollapsed}>
                <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')} title={c('Link').t`Shared`}>{c('Link')
                    .t`Shared`}</span>
            </DriveSidebarListItem>

            {showSharedWithMeSection && <DriveSidebarSharedWithMe shareId={shareId} collapsed={isCollapsed} />}

            <DriveSidebarListItem to="/trash" icon={IcTrash} shareId={shareId} collapsed={isCollapsed}>
                <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')} title={c('Link').t`Trash`}>{c('Link')
                    .t`Trash`}</span>
            </DriveSidebarListItem>

            {isEasySwitchNewUIEnabled && <EasySwitchSidebarSection collapsed={isCollapsed} />}
        </SidebarList>
    );
};
