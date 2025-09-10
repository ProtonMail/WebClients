import { useEffect, useMemo, useState } from 'react';

import 'core-js/actual/array/from-async';

import { Loader } from '@proton/components';
import clsx from '@proton/utils/clsx';

import DriveExpandButton from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarFolders/DriveExpandButton';
import DriveSidebarListItem from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarListItem';
import { getDevicesSectionName } from '../../../components/sections/Devices/constants';
import { useSidebarFolders } from '../../sidebar/hooks/useSidebarFolders';
import { type StoreDevice, useDeviceStore } from '../devices.store';
import { DevicesSidebarItem } from './DevicesSidebarItem';

export const DevicesSidebar = ({ collapsed }: { collapsed: boolean }) => {
    const [isListExpanded, setListExpanded] = useState(false);
    const { deviceList, isLoading } = useDeviceStore();
    const { loadDevicesRoot } = useSidebarFolders();

    const toggleList = () => {
        setListExpanded((value) => !value);
    };

    const sectionTitle = getDevicesSectionName();

    useEffect(() => {
        void loadDevicesRoot();
    }, [loadDevicesRoot]);

    const sortedDevices = useMemo(
        () =>
            deviceList.sort((a: StoreDevice, b: StoreDevice) => {
                const nameA = a.name.toUpperCase();
                const nameB = b.name.toUpperCase();
                if (nameA < nameB) {
                    return -1;
                }
                return nameA > nameB ? 1 : 0;
            }),
        [deviceList]
    );

    const showList = !collapsed && isListExpanded && sortedDevices.length > 0;

    return (
        <>
            <DriveSidebarListItem
                key="devices-root"
                to={'/devices'}
                icon="tv"
                onDoubleClick={toggleList}
                collapsed={collapsed}
            >
                <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={sectionTitle}>
                    {sectionTitle}
                </span>
                {isLoading ? (
                    <Loader className="drive-sidebar--icon inline-flex shrink-0" />
                ) : (
                    deviceList.length > 0 && (
                        <DriveExpandButton className="shrink-0" expanded={isListExpanded} onClick={toggleList} />
                    )
                )}
            </DriveSidebarListItem>

            {showList && sortedDevices.map((device) => <DevicesSidebarItem key={device.uid} device={device} />)}
        </>
    );
};
