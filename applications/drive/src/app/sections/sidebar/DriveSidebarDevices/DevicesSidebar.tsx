import { useMemo, useState } from 'react';

import { Loader } from '@proton/components';
import clsx from '@proton/utils/clsx';

import DriveExpandButton from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarFolders/DriveExpandButton';
import DriveSidebarListItem from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarListItem';
import { getDevicesSectionName } from '../../../components/sections/Devices/constants';
import type { TreeItemWithChildren } from '../../../modules/directoryTree';
import { stringComparator } from '../../../modules/sorting';
import { DevicesSidebarItem } from './DevicesSidebarItem';

type Props = {
    deviceRoot: TreeItemWithChildren;
    toggleExpand: (treeItemId: string) => Promise<void>;
    isExpanded: boolean;
    isCollapsed: boolean;
};

export const DevicesSidebar = ({ isCollapsed, deviceRoot, toggleExpand, isExpanded }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const sectionTitle = getDevicesSectionName();

    const sortedDevices = useMemo(() => {
        const unsorted = deviceRoot.children ? Object.values(deviceRoot.children) : [];
        return unsorted.sort((a, b) => stringComparator(a.name, b.name));
    }, [deviceRoot.children]);

    const showList = !isCollapsed && isExpanded && sortedDevices.length > 0;
    const shouldShowArrow = !deviceRoot.hasLoadedChildren || deviceRoot.hasChildren;

    const handleExpand = () => {
        setIsLoading(true);
        void toggleExpand(deviceRoot.treeItemId).finally(() => setIsLoading(false));
    };

    return (
        <>
            <DriveSidebarListItem
                key="devices-root"
                to={'/devices'}
                icon="tv"
                onDoubleClick={handleExpand}
                collapsed={isCollapsed}
            >
                <span className={clsx('text-ellipsis', isCollapsed && 'sr-only')} title={sectionTitle}>
                    {sectionTitle}
                </span>
                {isLoading ? (
                    <Loader className="drive-sidebar--icon inline-flex shrink-0" />
                ) : (
                    shouldShowArrow && (
                        <DriveExpandButton className="shrink-0" expanded={isExpanded} onClick={handleExpand} />
                    )
                )}
            </DriveSidebarListItem>

            {showList &&
                sortedDevices.map((device) => (
                    <DevicesSidebarItem key={device.nodeUid} toggleExpand={toggleExpand} device={device} />
                ))}
        </>
    );
};
