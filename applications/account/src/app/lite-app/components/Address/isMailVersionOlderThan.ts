/**
 * Checks if an app version is older than a specified version
 * @param appVersion - Version string in format "platform-app@X.X.X" (e.g., "ios-mail@7.0.5")
 * @param platform - Platform to check ('ios' or 'android')
 * @param targetVersion - Target version to compare against (e.g., "7.0.5")
 */
export const isMailVersionOlderThan = (
    appVersion: string | null,
    platform: 'ios' | 'android',
    targetVersion: string
): boolean => {
    if (!appVersion || !appVersion.startsWith(`${platform}-`)) {
        return false;
    }

    // Extract version number from format "platform-app@X.X.X"
    const versionMatch = appVersion.match(/@(.+)$/);
    if (!versionMatch) {
        return false;
    }

    const currentVersion = versionMatch[1];

    // Split versions into parts and convert to numbers
    const currentParts = currentVersion.split('.').map(Number);
    const targetParts = targetVersion.split('.').map(Number);

    // Validate that both versions have exactly 3 parts (X.X.X format)
    if (currentParts.length !== 3 || targetParts.length !== 3) {
        return false;
    }

    // Validate that all parts are valid numbers
    if (currentParts.some(isNaN) || targetParts.some(isNaN)) {
        return false;
    }

    // Compare each part
    for (let i = 0; i < 3; i++) {
        if (currentParts[i] < targetParts[i]) {
            return true;
        }
        if (currentParts[i] > targetParts[i]) {
            return false;
        }
    }

    // Versions are equal
    return false;
};
