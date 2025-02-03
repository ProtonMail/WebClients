import { Loader } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useDevicesListing } from '../../../../../store/_devices';
import { getDevicesSectionName } from '../../../../sections/Devices/constants';
import ExpandButton from '../DriveSidebarFolders/DriveExpandButton';
import DriveSidebarListItem from '../DriveSidebarListItem';

export function SidebarDevicesRoot({
    isExpanded,
    toggleExpand,
    collapsed,
}: {
    toggleExpand: () => void;
    isExpanded: boolean;
    collapsed: boolean;
}) {
    const { cachedDevices, isLoading } = useDevicesListing();
    const sectionTitle = getDevicesSectionName();

    return (
        <DriveSidebarListItem
            key="devices-root"
            to={'/devices'}
            icon="tv"
            isActive={(match) => match?.url === '/devices'}
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
                    <ExpandButton className="shrink-0" expanded={isExpanded} onClick={() => toggleExpand()} />
                )
            )}
        </DriveSidebarListItem>
    );
}
