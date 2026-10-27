/** Native notification transport supplied by Lumo Desktop. */
export interface DesktopNotificationsApi {
    isPermissionGranted(): Promise<boolean>;
    requestPermission(): Promise<boolean>;
    show(input: { title: string; body: string }): Promise<void>;
}

declare global {
    interface Window {
        LumoNotifications?: DesktopNotificationsApi;
    }
}

function notifications(): DesktopNotificationsApi {
    const api = typeof window !== 'undefined' ? window.LumoNotifications : undefined;
    if (!api) {
        throw new Error(
            'Native notifications are unavailable. Update Lumo Desktop or turn off completion notifications.'
        );
    }
    return api;
}

export async function requestDesktopNotificationPermission(): Promise<boolean> {
    const api = notifications();
    return (await api.isPermissionGranted()) || api.requestPermission();
}

export async function showDesktopNotification(input: { title: string; body: string }): Promise<void> {
    await notifications().show(input);
}
