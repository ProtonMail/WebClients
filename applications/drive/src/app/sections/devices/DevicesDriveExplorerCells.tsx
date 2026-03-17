import { c } from 'ttag';

import { IcTv } from '@proton/icons/icons/IcTv';

import { FileName } from '../../components/FileName';
import { getDeviceIconText } from '../../components/sections/FileBrowser/utils';
import type { CellDefinition, GridDefinition } from '../../statelessComponents/DriveExplorer/types';
import { useDevicesStore } from './useDevices.store';

export const getDevicesCells = (): CellDefinition[] => [
    {
        id: 'name',
        headerText: c('Label').t`Name`,
        className: 'flex-1',
        testId: 'column-name',
        render: (uid) => {
            const DeviceNameCellComponent = () => {
                const name = useDevicesStore((state) => state.getItem(uid)?.name);

                if (!name) {
                    return null;
                }

                return (
                    <span className="flex items-center flex-nowrap mr-4" aria-label={name}>
                        <IcTv alt={getDeviceIconText(name)} className="mr-2" />
                        <FileName text={name} testId="name-cell" />
                    </span>
                );
            };
            return <DeviceNameCellComponent />;
        },
    },
];

export const getDevicesGrid = (): GridDefinition => ({
    name: (uid) => {
        const NameComponent = () => {
            const name = useDevicesStore((state) => state.getItem(uid)?.name);
            if (!name) {
                return null;
            }
            return (
                <div className="flex items-center mx-auto">
                    <FileName text={name} testId="grid-item-name" />
                </div>
            );
        };
        return <NameComponent />;
    },
    mainContent: (uid) => {
        const MainContentComponent = () => {
            const name = useDevicesStore((state) => state.getItem(uid)?.name);
            if (!name) {
                return null;
            }
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <IcTv size={10} alt={getDeviceIconText(name)} />
                </div>
            );
        };
        return <MainContentComponent />;
    },
});
