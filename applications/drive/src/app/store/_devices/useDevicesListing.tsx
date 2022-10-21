import { createContext, useContext, useEffect, useState } from 'react';

import { useLoading } from '@proton/components/hooks';

import { reportError } from '../_utils';
import { DevicesState } from './interface';
import useDevicesApi from './useDevicesApi';

export function useDevicesListingProvider() {
    const devicesApi = useDevicesApi();

    const [state, setState] = useState<DevicesState>({});
    const [isLoading, withLoading] = useLoading();

    const loadDevices = async (abortSignal?: AbortSignal) => {
        const devices = await withLoading(devicesApi.loadDevices(abortSignal));
        if (devices) {
            setState(devices);
        }
    };

    const getState = () => {
        return Object.values(state);
    };

    const getDeviceByShareId = (shareId: string) => {
        return getState().find((device) => {
            return device.shareId === shareId;
        });
    };

    return {
        isLoading,
        loadDevices,
        cachedDevices: getState(),
        getDeviceByShareId,
    };
}

const LinksListingContext = createContext<{
    isLoading: boolean;
    cachedDevices: ReturnType<typeof useDevicesListingProvider>['cachedDevices'];
    getDeviceByShareId: ReturnType<typeof useDevicesListingProvider>['getDeviceByShareId'];
} | null>(null);

export function DevicesListingProvider({ children }: { children: React.ReactNode }) {
    const value = useDevicesListingProvider();

    useEffect(() => {
        const ac = new AbortController();
        value.loadDevices(ac.signal).catch(reportError);

        return () => {
            ac.abort();
        };
    }, []);
    return (
        <LinksListingContext.Provider
            value={{
                isLoading: value.isLoading,
                cachedDevices: value.cachedDevices,
                getDeviceByShareId: value.getDeviceByShareId,
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
