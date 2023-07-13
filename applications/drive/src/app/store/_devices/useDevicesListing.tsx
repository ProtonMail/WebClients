import { createContext, useContext, useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';

import { sendErrorReport } from '../../utils/errorHandling';
import { useLink } from '../_links';
import { useVolumesState } from '../_volumes';
import { Device } from './interface';
import useDevicesApi from './useDevicesApi';
import useDevicesFeatureFlag from './useDevicesFeatureFlag';

export function useDevicesListingProvider() {
    const devicesApi = useDevicesApi();
    const { getLink } = useLink();
    const volumesState = useVolumesState();
    const [state, setState] = useState<Map<string, Device>>(new Map());
    const [isLoading, withLoading] = useLoading();

    const loadDevices = (abortSignal: AbortSignal) =>
        withLoading(async () => {
            const devices = await devicesApi.loadDevices(abortSignal);

            if (devices) {
                const devicesMap = new Map();
                for (const key in devices) {
                    const { volumeId, shareId, linkId, name } = devices[key];
                    volumesState.setVolumeShareIds(volumeId, [shareId]);
                    devices[key] = {
                        ...devices[key],
                        name: name || (await getLink(abortSignal, shareId, linkId)).name,
                    };
                    devicesMap.set(key, devices[key]);
                }
                setState(devicesMap);
            }
        });

    const getState = () => {
        return [...state.values()];
    };

    const getDeviceByShareId = (shareId: string) => {
        return getState().find((device) => {
            return device.shareId === shareId;
        });
    };

    const removeDevice = (deviceId: string) => {
        const newState = new Map(state);
        newState.delete(deviceId);
        setState(newState);
    };

    const renameDevice = (deviceId: string, name: string) => {
        const newState = new Map(state);
        const device = newState.get(deviceId);
        if (!device) {
            return;
        }
        newState.set(deviceId, {
            ...device,
            name,
        });
        setState(newState);
    };

    return {
        isLoading,
        loadDevices,
        cachedDevices: getState(),
        getDeviceByShareId,
        renameDevice,
        removeDevice,
    };
}

const LinksListingContext = createContext<{
    isLoading: boolean;
    cachedDevices: ReturnType<typeof useDevicesListingProvider>['cachedDevices'];
    getDeviceByShareId: ReturnType<typeof useDevicesListingProvider>['getDeviceByShareId'];
    removeCachedDevice: ReturnType<typeof useDevicesListingProvider>['removeDevice'];
    renameCachedDevice: ReturnType<typeof useDevicesListingProvider>['renameDevice'];
} | null>(null);

export function DevicesListingProvider({ children }: { children: React.ReactNode }) {
    const value = useDevicesListingProvider();
    const isDevicesFlagEnabled = useDevicesFeatureFlag();

    useEffect(() => {
        if (!isDevicesFlagEnabled) {
            return;
        }

        const ac = new AbortController();
        value.loadDevices(ac.signal).catch(sendErrorReport);

        return () => {
            ac.abort();
        };
    }, [isDevicesFlagEnabled]);

    return (
        <LinksListingContext.Provider
            value={{
                isLoading: value.isLoading,
                cachedDevices: value.cachedDevices,
                getDeviceByShareId: value.getDeviceByShareId,
                removeCachedDevice: value.removeDevice,
                renameCachedDevice: value.renameDevice,
            }}
        >
            {children}
        </LinksListingContext.Provider>
    );
}

export default function useDevicesListing() {
    const state = useContext(LinksListingContext);
    if (!state) {
        throw new Error('Trying to use uninitialized LinksListingProvider');
    }
    return state;
}
