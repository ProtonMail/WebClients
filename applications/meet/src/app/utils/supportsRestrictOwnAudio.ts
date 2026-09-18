import { getBrowser } from '@proton/shared/lib/helpers/browser';
import { isElectronApp, isElectronOnWindows, isElectronRuntimeAtLeast } from '@proton/shared/lib/helpers/desktop';
import { Version } from '@proton/shared/lib/helpers/version';

/* Browsers shipping the `restrictOwnAudio` display media constraint, by major version. */
const MINIMUM_BROWSER_MAJOR_VERSIONS: Partial<Record<string, number>> = {
    Brave: 141,
    Chrome: 141,
    Chromium: 141,
    Edge: 141,
    Opera: 125,
};

const supportsRestrictOwnAudioInBrowser = () => {
    const { name, version } = getBrowser();

    const minimumMajorVersion = name ? MINIMUM_BROWSER_MAJOR_VERSIONS[name] : undefined;

    if (minimumMajorVersion === undefined || !version) {
        return false;
    }

    return new Version(version).isGreaterThanOrEqual(`${minimumMajorVersion}`);
};

/**
 * `minimumElectronVersion` comes from the `MeetScreenShareAudioSupportedElectronVersion` variant and
 * only gates the desktop app, so browsers stay on their own support matrix.
 */
export const supportsRestrictOwnAudio = (minimumElectronVersion: string | undefined) => {
    if (!isElectronApp) {
        return supportsRestrictOwnAudioInBrowser();
    }

    if (!minimumElectronVersion) {
        return false;
    }

    return !isElectronOnWindows || isElectronRuntimeAtLeast(minimumElectronVersion);
};
