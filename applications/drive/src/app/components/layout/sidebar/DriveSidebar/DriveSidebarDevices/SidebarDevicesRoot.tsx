import { Loader } from '@proton/components';

import { useDevicesListing } from '../../../../../store/_devices';
import { getDevicesSectionName } from '../../../../sections/Devices/constants';
import ExpandButton from '../DriveSidebarFolders/ExpandButton';
import DriveSidebarListItem from '../DriveSidebarListItem';

export function SidebarDevicesRoot({
    path,
    isExpanded,
    toggleExpand,
}: {
    path: string;
    toggleExpand: () => void;
    isExpanded: boolean;
}) {
    const { cachedDevices, isLoading } = useDevicesListing();
    const sectionTitle = getDevicesSectionName();

    return (
        <DriveSidebarListItem
            key="devices-root"
            to={'/devices'}
            icon="tv"
            isActive={path === '/devices'}
            onDoubleClick={toggleExpand}
        >
            <span className="text-ellipsis" title={sectionTitle}>
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
