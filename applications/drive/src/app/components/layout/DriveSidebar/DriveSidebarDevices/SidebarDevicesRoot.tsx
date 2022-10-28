import { Loader } from '@proton/components/components';

import { useDevicesListing } from '../../../../store/_devices';
import { getDevicesSectionName } from '../../../sections/Devices/constants';
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
                <Loader className="ml0-5 drive-sidebar--icon inline-flex flex-item-noshrink" />
            ) : (
                cachedDevices.length > 0 && (
                    <ExpandButton
                        className="ml0-5 flex-item-noshrink"
                        expanded={isExpanded}
                        onClick={() => toggleExpand()}
                    />
                )
            )}
        </DriveSidebarListItem>
    );
}
