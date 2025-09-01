import { Loader } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { getDevicesSectionName } from '../../../components/sections/Devices/constants';
import { useDevicesListing } from '../../../store/_devices';
import { DriveExpandButton } from '../DriveSidebarFolders/DriveExpandButton';
import { DriveSidebarListItem } from '../DriveSidebarListItem';

export const SidebarDevicesRoot = ({
    isExpanded,
    toggleExpand,
    collapsed,
}: {
    toggleExpand: () => void;
    isExpanded: boolean;
    collapsed: boolean;
}) => {
    const { cachedDevices, isLoading } = useDevicesListing();
    const sectionTitle = getDevicesSectionName();

    return (
        <DriveSidebarListItem
            key="devices-root"
            to={'/devices'}
            icon="tv"
            onDoubleClick={toggleExpand}
            collapsed={collapsed}
        >
            <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={sectionTitle}>
                {sectionTitle}
            </span>
            {isLoading ? (
                <Loader className="drive-sidebar--icon inline-flex shrink-0" />
            ) : (
                cachedDevices.length > 0 && (
                    <DriveExpandButton className="shrink-0" expanded={isExpanded} onClick={() => toggleExpand()} />
                )
            )}
        </DriveSidebarListItem>
    );
};
