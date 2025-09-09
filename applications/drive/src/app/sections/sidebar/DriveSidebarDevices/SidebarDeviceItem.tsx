import { useEffect } from 'react';

import { useFolderTree } from '../../../store';
import type { Device } from '../../../store/_devices';
import { DriveExpandButton } from '../DriveSidebarFolders/DriveExpandButton';
import { DriveSidebarSubfolders } from '../DriveSidebarFolders/DriveSidebarSubfolders';
import { DriveSidebarListItem } from '../DriveSidebarListItem';
import { generateSidebarItemStyle } from '../utils';

export const SidebarDeviceItem = ({
    device,
    setSidebarLevel,
}: {
    device: Device;
    setSidebarLevel: (level: number) => void;
}) => {
    const { deepestOpenedLevel, rootFolder, toggleExpand } = useFolderTree(device.shareId, {
        rootLinkId: device.linkId,
    });

    useEffect(() => {
        setSidebarLevel(deepestOpenedLevel);
    }, [deepestOpenedLevel]);

    return (
        <div>
            <DriveSidebarListItem
                to={`/${device.shareId}/folder/${device.linkId}`}
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
                    onClick={() => toggleExpand(device.linkId)}
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
