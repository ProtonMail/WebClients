import { useState } from 'react';

import { SidebarDeviceList } from './SidebarDevicesList';
import { SidebarDevicesRoot } from './SidebarDevicesRoot';

const DriveSidebarDevices = ({ path, setSidebarLevel }: { path: string; setSidebarLevel: (level: number) => void }) => {
    const [isListExpanded, setListExpanded] = useState(false);

    const toggleList = () => {
        setListExpanded((value) => !value);
    };

    return (
        <>
            <SidebarDevicesRoot path={path} toggleExpand={toggleList} isExpanded={isListExpanded} />
            <SidebarDeviceList isRootExpanded={isListExpanded} setSidebarLevel={setSidebarLevel} />
        </>
    );
};

export default DriveSidebarDevices;
