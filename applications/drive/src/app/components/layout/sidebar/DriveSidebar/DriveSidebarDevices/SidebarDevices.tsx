import { useState } from 'react';

import { SidebarDeviceList } from './SidebarDevicesList';
import { SidebarDevicesRoot } from './SidebarDevicesRoot';

const DriveSidebarDevices = ({ setSidebarLevel }: { setSidebarLevel: (level: number) => void }) => {
    const [isListExpanded, setListExpanded] = useState(false);

    const toggleList = () => {
        setListExpanded((value) => !value);
    };

    return (
        <>
            <SidebarDevicesRoot toggleExpand={toggleList} isExpanded={isListExpanded} />
            <SidebarDeviceList isRootExpanded={isListExpanded} setSidebarLevel={setSidebarLevel} />
        </>
    );
};

export default DriveSidebarDevices;
