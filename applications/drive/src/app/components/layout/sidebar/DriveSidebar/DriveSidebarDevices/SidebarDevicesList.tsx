import { useDevicesListing } from '../../../../../store/_devices';
import { SidebarDeviceItem } from './SidebarDeviceItem';

export const SidebarDeviceList = ({
    isRootExpanded,
    setSidebarLevel,
}: {
    isRootExpanded: boolean;
    setSidebarLevel: (level: number) => void;
}) => {
    const { cachedDevices } = useDevicesListing();
    if (!isRootExpanded || cachedDevices?.length === 0) {
        return null;
    }

    const sortedDevices = [...cachedDevices].sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        return nameA > nameB ? 1 : 0;
    });

    return (
        <>
            {sortedDevices.map((device) => (
                <SidebarDeviceItem key={device.id + device.name} device={device} setSidebarLevel={setSidebarLevel} />
            ))}
        </>
    );
};
