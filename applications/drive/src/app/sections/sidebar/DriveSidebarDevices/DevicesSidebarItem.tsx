import { splitNodeUid } from '@proton/drive';

import DriveExpandButton from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarFolders/DriveExpandButton';
import DriveSidebarListItem from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarListItem';
import { generateSidebarItemStyle } from '../../../components/layout/sidebar/DriveSidebar/utils';
import type { TreeItemWithChildren } from '../../../modules/directoryTree';
import { DriveSidebarSubfolders } from '../../sidebar/DriveSidebarFolders/DriveSidebarSubfolders';

type Props = {
    device: TreeItemWithChildren;
    toggleExpand: (treeItemId: string) => Promise<void>;
};

export const DevicesSidebarItem = ({ device, toggleExpand }: Props) => {
    const { nodeId } = splitNodeUid(device.nodeUid);
    const shareId = device.deprecatedShareId;
    const isExpanded = device.children !== null;

    return (
        <div>
            <DriveSidebarListItem
                to={`/${shareId}/folder/${nodeId}`}
                icon="tv"
                shareId={shareId}
                style={generateSidebarItemStyle(1)}
                collapsed={false} // we never show expended devices when collapsed
            >
                <span className="text-ellipsis" title={device.name} data-testid="sidebar-device-name">
                    {device.name}
                </span>
                <DriveExpandButton
                    className="shrink-0"
                    expanded={isExpanded}
                    onClick={() => toggleExpand(device.treeItemId)}
                />
            </DriveSidebarListItem>
            {device.children && shareId && (
                <DriveSidebarSubfolders
                    key={device.nodeUid}
                    shareId={shareId}
                    children={Object.values(device.children)}
                    toggleExpand={toggleExpand}
                    level={1}
                />
            )}
        </div>
    );
};
