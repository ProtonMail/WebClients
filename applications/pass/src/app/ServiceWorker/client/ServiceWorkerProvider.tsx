import {
    type FC,
    type PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import type { MaybeNull } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { type ServiceWorkerClient, createServiceWorkerClient } from './client';

type ServiceWorkerState = { updateAvailable: boolean };
type ServiceWorkerContextValue = { client: ServiceWorkerClient; state: ServiceWorkerState };

export const ServiceWorkerClientID = uniqueId(16);
export const ServiceWorkerEnabled = 'serviceWorker' in navigator;
export const ServiceWorkerContext = createContext<MaybeNull<ServiceWorkerContextValue>>(null);

const client = ServiceWorkerEnabled ? createServiceWorkerClient(ServiceWorkerClientID) : null;

export const ServiceWorkerProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<ServiceWorkerState>({ updateAvailable: false });
    const unloading = useRef(false);

    useEffect(() => {
        const onBeforeUnload = () => {
            /** Avoids flagging update available during a hard-refresh */
            unloading.current = true;

            /** Ask service worker for pending files deletion.
             * These operations are async and cannot be guaranteed
             * to succeed during the `unload` event */
            if (client) {
                const filenames = fileStorage.gc?.queued() ?? [];
                client.send({ type: 'fs_gc', filenames });
            }
        };

        window.addEventListener('beforeunload', onBeforeUnload, { once: true });
        const onUpdateAvailable = () => !unloading.current && setState({ updateAvailable: true });

        void client?.register({ onUpdateAvailable });
        return client?.listen();
    }, []);

    return (
        <ServiceWorkerContext.Provider value={useMemo(() => (client ? { client, state } : null), [state])}>
            {children}
        </ServiceWorkerContext.Provider>
    );
};

export const useServiceWorker = () => useContext(ServiceWorkerContext)?.client ?? null;
export const useServiceWorkerState = () => useContext(ServiceWorkerContext)?.state ?? null;
