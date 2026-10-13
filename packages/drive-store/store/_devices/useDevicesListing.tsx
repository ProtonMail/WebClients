import { createContext, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useLoading } from '@proton/hooks';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import useLink from '../_links/useLink';
import { useVolumesState } from '../_volumes';
import type { Device } from './interface';
import useDevicesApi from './useDevicesApi';

export function useDevicesListingProvider() {
    const devicesApi = useDevicesApi();
    const { getLink } = useLink();
    const volumesState = useVolumesState();
    const [state, setState] = useState<Map<string, Device>>(new Map());
    const [, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const loadDevices = (abortSignal: AbortSignal) =>
        withLoading(async () => {
            const devices = await devicesApi.loadDevices(abortSignal);

            if (devices) {
                const devicesMap = new Map();
                let hasError = false;

                for (const key in devices) {
                    const { volumeId, shareId, linkId, name } = devices[key];

                    try {
                        volumesState.setVolumeShareIds(volumeId, [shareId]);

                        devices[key] = {
                            ...devices[key],
                            name: name || (await getLink(abortSignal, shareId, linkId)).name,
                        };

                        devicesMap.set(key, devices[key]);
                    } catch (e) {
                        hasError = true;

                        // Send an error report for this
                        sendErrorReport(
                            new EnrichedError('Decrypting device failed', {
                                tags: {
                                    volumeId,
                                    shareId,
                                    linkId,
                                },
                                extra: {
                                    e,
                                },
                            })
                        );
                    }
                }

                if (hasError) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Error decrypting a computer`,
                    });
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

    return {
        loadDevices,
        cachedDevices: getState(),
        getDeviceByShareId,
    };
}

const LinksListingContext = createContext<{
    getDeviceByShareId: ReturnType<typeof useDevicesListingProvider>['getDeviceByShareId'];
} | null>(null);

export function DevicesListingProvider({ children }: { children: React.ReactNode }) {
    const value = useDevicesListingProvider();

    useEffect(() => {
        const ac = new AbortController();
        value.loadDevices(ac.signal).catch(sendErrorReport);

        return () => {
            ac.abort();
        };
    }, []);

    return (
        <LinksListingContext.Provider
            value={{
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
