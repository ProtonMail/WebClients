import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import type { NativeNotificationPermission } from '@proton/lumo-api-client/core/desktop-notifications';

interface NativeNotificationSettings {
    /** Current OS notification permission; undefined while unavailable or still loading. */
    permission: NativeNotificationPermission | undefined;
    /** Rechecks notification permission and updates every consumer without prompting the user. */
    refreshPermission: () => Promise<void>;
    /** Requests OS notification permission and refreshes the shared state. */
    requestPermission: () => Promise<boolean>;
    /** Opens OS notification settings when supported by the native app. */
    openSettings: () => Promise<void>;
}

/**
 * Subscribes to native notification permission changes.
 *
 * Note only desktop is currently implemented.
 *
 * @warning Call this hook only inside DeviceSettingsProvider. Calling it from consumers
 * creates duplicate OS permission queries and event listeners with independent state.
 * Read shared permission state and actions through useDeviceSettings().notificationSettings instead.
 */
export const useNativeNotificationPermission = (): NativeNotificationSettings => {
    const { createNotification } = useNotifications();
    const [permission, setPermission] = useState<NativeNotificationPermission>();
    const mounted = useRef(false);
    const notificationsApi = window.LumoNotifications;

    const refreshPermission = useCallback(async () => {
        if (!notificationsApi) return;
        const state = await notificationsApi.getPermissionState();
        if (mounted.current) setPermission(state);
    }, [notificationsApi]);

    const requestPermission = useCallback(async () => {
        try {
            if (!notificationsApi) return false;
            const granted = await notificationsApi.requestPermission();
            if (granted && mounted.current) setPermission('granted');
            await refreshPermission().catch((error) => {
                console.warn('Could not refresh desktop notification permission', error);
            });
            return granted;
        } catch (error) {
            // translator: Error when the operating system notification permission request fails.
            const message = c('collider_2025:Error').t`Could not enable desktop notifications. Please try again.`;
            createNotification({ text: message, type: 'error' });
            return false;
        }
    }, [notificationsApi, refreshPermission]);

    const openSettings = useCallback(async () => {
        try {
            await notificationsApi?.openSettings();
        } catch (error) {
            // translator: Error when the operating system notification settings cannot be opened automatically.
            const message = c('collider_2025:Error')
                .t`Could not open notification settings. Please open System Settings manually.`;
            createNotification({ text: message, type: 'error' });
        }
    }, [notificationsApi]);

    useEffect(() => {
        if (!notificationsApi) return;
        mounted.current = true;
        const refresh = () => {
            void refreshPermission().catch((error) => {
                console.warn('Could not check desktop notification permission', error);
            });
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') refresh();
        };

        refresh();
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            mounted.current = false;
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [notificationsApi, refreshPermission]);

    const value = useMemo(
        () => ({
            permission,
            refreshPermission,
            requestPermission,
            openSettings,
        }),
        [permission, refreshPermission, requestPermission, openSettings, notificationsApi]
    );
    return value;
};
