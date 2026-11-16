import { isDebianBased, isFedoraOrRedHatBased, isLinux, isMac, isWindows } from '@proton/shared/lib/helpers/browser';
import { getDownloadUrl } from '@proton/shared/lib/helpers/url';

/** Shown when we can't pick an installer for this computer, or the release file can't be loaded. */
export const LUMO_DESKTOP_DOWNLOAD_PAGE = 'https://proton.me/lumo/download';

export type LumoDesktopPlatform = 'macos' | 'windows' | 'linux';
type LinuxPackage = 'deb' | 'rpm';

interface LumoDesktopTarget {
    platform: LumoDesktopPlatform;
    /** Only set on Linux, where the release lists one file per package format. */
    linuxPackage?: LinuxPackage;
}

interface ReleaseFile {
    Url: string;
    Identifier?: string;
}

interface Release {
    CategoryName: string;
    Version: string;
    File: ReleaseFile[] | ReleaseFile;
}

/**
 * The installer that fits the visitor's computer, or null when we can't tell (ChromeOS, other
 * Linux distributions, unknown systems). There is one Windows build and one macOS build.
 */
export const getLumoDesktopTarget = (): LumoDesktopTarget | null => {
    if (isMac()) {
        return { platform: 'macos' };
    }
    if (isWindows()) {
        return { platform: 'windows' };
    }
    if (isLinux()) {
        if (isDebianBased()) {
            return { platform: 'linux', linuxPackage: 'deb' };
        }
        if (isFedoraOrRedHatBased()) {
            return { platform: 'linux', linuxPackage: 'rpm' };
        }
    }
    return null;
};

export const getLumoDesktopManifestUrl = (platform: LumoDesktopPlatform): string => {
    return getDownloadUrl(`/lumo/desktop/${platform}/v1/version.json`);
};

const pickFile = (files: ReleaseFile[], linuxPackage?: LinuxPackage): ReleaseFile | undefined => {
    if (!linuxPackage) {
        return files[0];
    }
    return files.find((file) => {
        return file.Url.toLowerCase().endsWith(`.${linuxPackage}`);
    });
};

/** Picks the installer URL of the latest stable release from a version.json payload. */
export const getInstallerUrlFromReleases = (payload: unknown, linuxPackage?: LinuxPackage): string | undefined => {
    const releases = (payload as { Releases?: Release[] } | null)?.Releases;
    if (!Array.isArray(releases)) {
        return undefined;
    }
    // The newest release comes first, as with the Drive release files.
    const stable = releases.find((release) => {
        return release.CategoryName === 'Stable';
    });
    if (!stable) {
        return undefined;
    }
    const files = Array.isArray(stable.File) ? stable.File : [stable.File];
    return pickFile(files, linuxPackage)?.Url;
};

/** Same as Drive: navigating to the installer starts the download and keeps the app open. */
export const startInstallerDownload = (url: string): void => {
    window.location.href = url;
};

export const fetchLumoDesktopInstallerUrl = async (target: LumoDesktopTarget): Promise<string | undefined> => {
    const response = await fetch(getLumoDesktopManifestUrl(target.platform));
    if (!response.ok) {
        throw new Error(`Lumo desktop release file returned ${response.status}`);
    }
    return getInstallerUrlFromReleases(await response.json(), target.linuxPackage);
};
