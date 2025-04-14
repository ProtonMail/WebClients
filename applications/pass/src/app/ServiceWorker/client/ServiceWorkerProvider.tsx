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
import { FileStorageGarbageCollector } from '@proton/pass/lib/file-storage/fs.gc';
import type { MaybeNull } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
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
            /** Prevent update notifications during hard refresh */
            unloading.current = true;

            if (fileStorage.gc && fileStorage.type !== 'Memory') {
                const filenames = fileStorage.gc.queued() ?? [];

                /** Request file deletion via service worker as browsers
                 * may terminate async operations during `beforeunload`
                 * so we can't rely on async file operations completing */
                if (client) client.send({ type: 'fs_gc', filenames });
                else {
                    /** Fallback: synchronously update localStorage deletion queue
                     * when service worker unavailable, as `beforeunload` doesn't
                     * guarantee completion of async operations */
                    const queueKey = FileStorageGarbageCollector.STORAGE_KEY;
                    const data = localStorage.getItem(queueKey);
                    const queue = safeCall((): string[] => (data ? JSON.parse(data) : []))() ?? [];
                    const pending = new Set(queue);
                    filenames.forEach((file) => pending.add(file));
                    localStorage.setItem(queueKey, JSON.stringify(Array.from(pending)));
                }
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
