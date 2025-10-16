import { useCallback, useState } from 'react';

export type DeviceType = 'microphone' | 'speaker' | 'camera';

interface DeviceLoadingState {
    microphone: string | null;
    speaker: string | null;
    camera: string | null;
}

interface UseDeviceLoadingReturn {
    loadingStates: DeviceLoadingState;
    isLoading: (deviceType: DeviceType, deviceId: string) => boolean;
    setLoading: (deviceType: DeviceType, deviceId: string | null) => void;
    withLoading: <T>(deviceType: DeviceType, deviceId: string, operation: () => Promise<T>) => Promise<T>;
}

/**
 * Custom hook to manage loading states for device changes (microphone, speaker, camera).
 * Centralizes loading state management that was previously duplicated across multiple components.
 *
 * @returns Object containing loading states and helper methods
 *
 * @example
 * const { isLoading, withLoading } = useDeviceLoading();
 *
 * // Wrap device change operation with loading state
 * await withLoading('microphone', deviceId, async () => {
 *   await handleMicrophoneChange(deviceId);
 * });
 *
 * // Check if device is loading
 * const loading = isLoading('microphone', deviceId);
 */
export const useDeviceLoading = (): UseDeviceLoadingReturn => {
    const [loadingStates, setLoadingStates] = useState<DeviceLoadingState>({
        microphone: null,
        speaker: null,
        camera: null,
    });

    /**
     * Check if a specific device is currently loading
     */
    const isLoading = useCallback(
        (deviceType: DeviceType, deviceId: string): boolean => {
            return loadingStates[deviceType] === deviceId;
        },
        [loadingStates]
    );

    /**
     * Set loading state for a specific device type
     */
    const setLoading = useCallback((deviceType: DeviceType, deviceId: string | null) => {
        setLoadingStates((prev) => ({
            ...prev,
            [deviceType]: deviceId,
        }));
    }, []);

    /**
     * Wrap an async operation with loading state management
     * Automatically sets loading state before operation and clears it after
     */
    const withLoading = useCallback(
        async <T>(deviceType: DeviceType, deviceId: string, operation: () => Promise<T>): Promise<T> => {
            setLoading(deviceType, deviceId);
            try {
                return await operation();
            } finally {
                setLoading(deviceType, null);
            }
        },
        [setLoading]
    );

    return {
        loadingStates,
        isLoading,
        setLoading,
        withLoading,
    };
};
