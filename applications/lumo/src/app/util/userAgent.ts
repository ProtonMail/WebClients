export const canShowWebComposer = (nativeComposerEnabled: boolean): boolean => {
    // Flag OFF: always show the web composer, even if the native composer is available
    if (!nativeComposerEnabled) {
        return true;
    }

    // Flag ON: hide the web composer if the native app meets the version criteria
    const appInfo = getNativeAppInfo();
    if (appInfo) {
        let targetVersion: string | null = null;
        const { version, platform } = appInfo;

        if (platform === 'ios') {
            targetVersion = '1.4.0';
        } else if (platform === 'android') {
            targetVersion = '1.4.0';
        }

        if (targetVersion && !isNativeVersionOlderThan(version, targetVersion)) {
            return false;
        }
    }

    return true;
};

export const canUseNativeAuth = (): boolean => {
    const appInfo = getNativeAppInfo();
    if (appInfo) {
        const { version, platform } = appInfo;
        let targetVersion: string | null = null;

        if (platform === 'ios') {
            targetVersion = '2.0.0';
        } else if (platform === 'android') {
            targetVersion = '2.0.0';
        }

        return targetVersion !== null && !isNativeVersionOlderThan(version, targetVersion);
    }

    return false;
};

/**
 * Returns true if the native app supports edit mode via the native composer (>= 1.5.0).
 * Older versions fall back to web-side editing.
 */
export const canUseNativeEditMode = (): boolean => {
    const appInfo = getNativeAppInfo();
    if (!appInfo) return false;
    return !isNativeVersionOlderThan(appInfo.version, '1.5.0');
};

/**
 * Extracts the native mobile app version from the User-Agent string
 * Expected format: ProtonLumo/VERSION (Platform details)
 *
 * Examples:
 * - "ProtonLumo/1.2.5 (iOS/26.0.1; iPhone 17)" → "1.2.5"
 * - "ProtonLumo/1.2.14-gms (Android 16; Google sdk_gphone64_arm64)" → "1.2.14-gms"
 *
 * @returns The version string or null if not found
 */
export const getNativeAppVersion = (): string | null => {
    const userAgent = navigator.userAgent;

    // Match ProtonLumo/ followed by version string until space or (
    const match = userAgent.match(/ProtonLumo\/([^\s(]+)/);

    return match ? match[1] : null;
};

/**
 * Checks if the app is running in a native mobile web view
 * by checking for ProtonLumo in the User-Agent
 */
export const isNativeMobileApp = (): boolean => {
    return navigator.userAgent.includes('ProtonLumo/');
};

/**
 * Gets the full native app info including platform
 * @returns Object with version and platform info, or null
 */
export const getNativeAppInfo = (): {
    version: string;
    platform: 'ios' | 'android' | 'unknown';
} | null => {
    const version = getNativeAppVersion();
    if (!version) return null;

    const userAgent = navigator.userAgent;

    let platform: 'ios' | 'android' | 'unknown';

    if (userAgent.includes('iOS/')) {
        platform = 'ios';
    } else if (userAgent.includes('Android')) {
        platform = 'android';
    } else {
        platform = 'unknown';
    }

    return { version, platform };
};

/**
 * Compares two version strings. Returns true (i.e. "older / unsafe") when the
 * input cannot be parsed — feature gates that wrap this with `!` must read as
 * fail-closed when the native UA is malformed.
 *
 */
export const isNativeVersionOlderThan = (version: string | null, targetVersion: string): boolean => {
    if (!version) return true;

    const currentMatch = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
    const targetMatch = targetVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
    if (!currentMatch || !targetMatch) return true;

    const currentParts = [Number(currentMatch[1]), Number(currentMatch[2]), Number(currentMatch[3])];
    const targetParts = [Number(targetMatch[1]), Number(targetMatch[2]), Number(targetMatch[3])];

    for (let i = 0; i < 3; i++) {
        if (currentParts[i] < targetParts[i]) return true;
        if (currentParts[i] > targetParts[i]) return false;
    }

    return false; // Versions are equal
};
