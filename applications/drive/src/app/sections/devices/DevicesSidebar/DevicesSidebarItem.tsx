import { useEffect } from 'react';

import { splitNodeUid } from '@proton/drive';

import DriveExpandButton from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarFolders/DriveExpandButton';
import DriveSidebarSubfolders from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarFolders/DriveSidebarSubfolders';
import DriveSidebarListItem from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarListItem';
import { generateSidebarItemStyle } from '../../../components/layout/sidebar/DriveSidebar/utils';
import { useFolderTree } from '../../../store';
import type { StoreDevice } from '../devices.store';

export const DevicesSidebarItem = ({
    device,
    setSidebarLevel,
}: {
    device: StoreDevice;
    setSidebarLevel: (level: number) => void;
}) => {
    const { nodeId } = splitNodeUid(device.rootFolderUid);
    const { deepestOpenedLevel, rootFolder, toggleExpand } = useFolderTree(device.shareId, {
        rootLinkId: nodeId,
    });

    useEffect(() => {
        setSidebarLevel(deepestOpenedLevel);
    }, [deepestOpenedLevel]);

    return (
        <div>
            <DriveSidebarListItem
                to={`/${device.shareId}/folder/${nodeId}`}
                icon="tv"
                shareId={device.shareId}
                style={generateSidebarItemStyle(1)}
                collapsed={false} // we never show expended devices when collapsed
            >
                <span className="text-ellipsis" title={device.name} data-testid="sidebar-device-name">
                    {device.name}
                </span>
                <DriveExpandButton
                    className="shrink-0"
                    expanded={Boolean(rootFolder?.isExpanded)}
                    onClick={() => toggleExpand(nodeId)}
                />
            </DriveSidebarListItem>
            <DriveSidebarSubfolders
                shareId={device.shareId}
                rootFolder={rootFolder}
                toggleExpand={toggleExpand}
                defaultLevel={1}
            />
        </div>
    );
};
