import { useEffect, useRef } from 'react';

import { useMeetStore } from '@proton/meet/store/hooks';
import { setDeviceList } from '@proton/meet/store/slices/deviceManagementSlice';
import { toSerializableDevice } from '@proton/meet/utils/deviceUtils';

type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';
const KINDS: DeviceKind[] = ['audioinput', 'audiooutput', 'videoinput'];

const RECHECK_DELAY_MS = 150;

const getFingerprint = (devices: MediaDeviceInfo[]) => devices.map((d) => `${d.deviceId}:${d.groupId}`).join(',');

/**
 * Syncs the available device list to Redux by subscribing to
 * `navigator.mediaDevices.devicechange` directly, bypassing the React-effect
 * lag that broke device handoffs during Bluetooth transitions.
 *
 * A 150ms re-enumerate covers Chromium's enumerate-cache race where the
 * first call after a devicechange can return stale data.
 */
export const useDeviceListSync = () => {
    const store = useMeetStore();

    const lastFingerprintRef = useRef<Map<DeviceKind, string>>(new Map());
    const pendingRecheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
            return;
        }

        const lastFingerprint = lastFingerprintRef.current;
        const pendingRecheck = pendingRecheckRef;

        const enumerateAndDispatch = async () => {
            let devices: MediaDeviceInfo[];

            try {
                devices = await navigator.mediaDevices.enumerateDevices();
            } catch {
                return;
            }

            for (const kind of KINDS) {
                const list = devices.filter((d) => d.kind === kind && d.deviceId !== '');
                const fingerprint = getFingerprint(list);

                if (fingerprint === lastFingerprint.get(kind)) {
                    continue;
                }

                lastFingerprint.set(kind, fingerprint);
                store.dispatch(setDeviceList({ kind, devices: list.map(toSerializableDevice) }));
            }
        };

        const handleDeviceChange = () => {
            void enumerateAndDispatch();

            if (pendingRecheck.current) {
                clearTimeout(pendingRecheck.current);
            }

            pendingRecheck.current = setTimeout(() => {
                pendingRecheck.current = null;
                void enumerateAndDispatch();
            }, RECHECK_DELAY_MS);
        };

        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        void enumerateAndDispatch();

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);

            if (pendingRecheck.current) {
                clearTimeout(pendingRecheck.current);
                pendingRecheck.current = null;
            }

            lastFingerprint.clear();
        };
    }, [store]);
};
