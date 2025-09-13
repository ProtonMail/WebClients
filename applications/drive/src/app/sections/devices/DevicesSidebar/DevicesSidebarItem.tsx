import { useShallow } from 'zustand/react/shallow';

import { splitNodeUid } from '@proton/drive';

import DriveExpandButton from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarFolders/DriveExpandButton';
import DriveSidebarListItem from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarListItem';
import { generateSidebarItemStyle } from '../../../components/layout/sidebar/DriveSidebar/utils';
import { DriveSidebarSubfolders } from '../../sidebar/DriveSidebarFolders/DriveSidebarSubfolders';
import { useSidebarStore } from '../../sidebar/hooks/useSidebar.store';
import { useSidebarFolders } from '../../sidebar/hooks/useSidebarFolders';
import type { StoreDevice } from '../devices.store';

export const DevicesSidebarItem = ({ device }: { device: StoreDevice }) => {
    const uid = device.rootFolderUid;
    const { nodeId } = splitNodeUid(uid);

    const { isExpanded, children } = useSidebarStore(
        useShallow((state) => {
            return {
                isExpanded: !!state.getItem(uid)?.isExpanded,
                children: state.getChildren(uid),
            };
        })
    );
    const { toggleExpand } = useSidebarFolders();

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
                <DriveExpandButton className="shrink-0" expanded={isExpanded} onClick={() => toggleExpand(uid)} />
            </DriveSidebarListItem>
            {isExpanded && <DriveSidebarSubfolders key={uid} shareId={device.shareId} children={children} />}
        </div>
    );
};
