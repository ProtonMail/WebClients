import { useState } from 'react';

import { SidebarDeviceList } from './SidebarDevicesList';
import { SidebarDevicesRoot } from './SidebarDevicesRoot';

export const DriveSidebarDevicesDeprecated = ({
    setSidebarLevel,
    collapsed,
}: {
    setSidebarLevel: (level: number) => void;
    collapsed: boolean;
}) => {
    const [isListExpanded, setListExpanded] = useState(false);

    const toggleList = () => {
        setListExpanded((value) => !value);
    };

    return (
        <>
            <SidebarDevicesRoot collapsed={collapsed} toggleExpand={toggleList} isExpanded={isListExpanded} />
            {!collapsed && <SidebarDeviceList isRootExpanded={isListExpanded} setSidebarLevel={setSidebarLevel} />}
        </>
    );
};
