import { useEffect } from 'react';

import { splitNodeUid } from '@proton/drive';

import DriveExpandButton from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarFolders/DriveExpandButton';
import DriveSidebarListItem from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarListItem';
import { generateSidebarItemStyle } from '../../../components/layout/sidebar/DriveSidebar/utils';
import { DriveSidebarSubfolders } from '../../sidebar/DriveSidebarFolders/DriveSidebarSubfolders';
import type { SidebarItem } from '../../sidebar/hooks/useSidebar.store';
import { useSidebarStore } from '../../sidebar/hooks/useSidebar.store';
import type { StoreDevice } from '../devices.store';
import { getDeviceName } from '../getDeviceName';

export const DevicesSidebarItem = ({
    device,
    // TODO: need to check with proper content
    // setSidebarLevel,
}: {
    device: StoreDevice;
    setSidebarLevel: (level: number) => void;
}) => {
    const { nodeId } = splitNodeUid(device.rootFolderUid);

    const { getChildren, setItem, updateItem, getItem } = useSidebarStore((state) => ({
        getChildren: state.getChildren,
        setItem: state.setItem,
        updateItem: state.updateItem,
        getItem: state.getItem,
    }));

    const deviceRootFolder: SidebarItem = {
        uid: device.rootFolderUid,
        name: getDeviceName(device),
        level: 1,
        parentUid: undefined,
        isLoading: false,
        isExpanded: !!getItem(device.rootFolderUid)?.isExpanded,
        hasLoadedChildren: false,
    };

    useEffect(() => {
        setItem(deviceRootFolder);
    }, [device]);

    const toggleExpand = async (uid: string) => {
        const isExpanded = getItem(uid)?.isExpanded;
        updateItem(uid, { isExpanded: !isExpanded });
    };

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
                    expanded={Boolean(deviceRootFolder.isExpanded)}
                    onClick={() => toggleExpand(nodeId)}
                />
            </DriveSidebarListItem>
            <DriveSidebarSubfolders
                key={deviceRootFolder.uid}
                shareId={device.shareId}
                children={getChildren(deviceRootFolder.uid)}
                toggleExpand={toggleExpand}
            />
        </div>
    );
};
