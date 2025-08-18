import { useEffect, useState } from 'react';

import 'core-js/actual/array/from-async';
import { c } from 'ttag';

import { Loader } from '@proton/components';
import { useDrive } from '@proton/drive/index';
import clsx from '@proton/utils/clsx';

import DriveExpandButton from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarFolders/DriveExpandButton';
import DriveSidebarListItem from '../../../components/layout/sidebar/DriveSidebar/DriveSidebarListItem';
import { getDevicesSectionName } from '../../../components/sections/Devices/constants';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { type StoreDevice, useDeviceStore } from '../devices.store';
import { DevicesSidebarItem } from './DevicesSidebarItem';

export const DevicesSidebar = ({
    setSidebarLevel,
    collapsed,
}: {
    setSidebarLevel: (level: number) => void;
    collapsed: boolean;
}) => {
    const [isListExpanded, setListExpanded] = useState(false);
    const { setDevice, deviceList, isLoading, setLoading } = useDeviceStore();
    const { handleError } = useSdkErrorHandler();

    const { drive } = useDrive();

    const toggleList = () => {
        setListExpanded((value) => !value);
    };

    const sectionTitle = getDevicesSectionName();

    useEffect(() => {
        const populateDevices = async () => {
            setLoading(true);
            try {
                for await (const device of drive.iterateDevices()) {
                    setDevice(device);
                }
            } catch (e) {
                const errorNotiticationText = c('Notification').t`Error while listing devices`;
                handleError(e, { fallbackMessage: errorNotiticationText });
            }
            setLoading(false);
        };
        void populateDevices();
    }, [drive, setDevice, setLoading, handleError]);

    const sortedDevices = deviceList.sort((a: StoreDevice, b: StoreDevice) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        return nameA > nameB ? 1 : 0;
    });

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
                        <DriveExpandButton
                            className="shrink-0"
                            expanded={isListExpanded}
                            onClick={() => toggleList()}
                        />
                    )
                )}
            </DriveSidebarListItem>

            {showList &&
                sortedDevices.map((device) => (
                    <DevicesSidebarItem key={device.uid} device={device} setSidebarLevel={setSidebarLevel} />
                ))}
        </>
    );
};
