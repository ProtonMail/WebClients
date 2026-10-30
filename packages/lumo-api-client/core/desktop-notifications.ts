export type NativeNotificationPermission = 'not_determined' | 'denied' | 'granted';

/** Native notification transport supplied by Lumo Desktop. */
export interface DesktopNotificationsApi {
    /** Reads whether permission is not yet requested, denied, or granted, without prompting the user. */
    getPermissionState(): Promise<NativeNotificationPermission>;
    /** Returns true only when permission is granted; both not_determined and denied return false. Does not prompt. */
    isPermissionGranted(): Promise<boolean>;
    requestPermission(): Promise<boolean>;
    /** Opens the operating system notification settings, when supported by the installed desktop app. */
    openSettings(): Promise<void>;
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

export async function showDesktopNotification(input: { title: string; body: string }): Promise<void> {
    await notifications().show(input);
}
