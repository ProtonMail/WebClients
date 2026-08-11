import { c } from 'ttag';

import { useFetchDownloadLinks } from './useFetchDownloadLinks';

/** Where to send users when no individual Windows build can be resolved. */
export const WINDOWS_DOWNLOAD_PAGE = 'https://protonvpn.com/download-windows/';
const FETCH_FROM_API = true;

/** Windows ships one build per architecture, so an exact version resolves to one link each. */
const WINDOWS_ARCHITECTURES = [
    { suffix: 'x64', getTitle: () => c('Download').t`Windows 10/11 (x64)` },
    { suffix: 'arm64', getTitle: () => c('Download').t`Windows 10/11 (ARM64)` },
];

const getVersionedLinks = (version: string) =>
    WINDOWS_ARCHITECTURES.map(({ suffix, getTitle }) => ({
        title: getTitle(),
        href: `https://protonvpn.com/download/ProtonVPN_v${version}_${suffix}.exe`,
    }));

/**
 * The Windows client builds to offer.
 *
 * When `version` names an exact release, its per-architecture builds are linked directly. Otherwise the
 * latest builds come from the same source as the Downloads page: the download API when
 * `DesktopDownloadApiEnabled` is on, a hardcoded list of the latest builds otherwise.
 *
 * Empty while the API request is in flight, and if it fails.
 */
export const useWindowsDownloadLinks = (version?: string) => {
    const { windows } = useFetchDownloadLinks(FETCH_FROM_API);

    if (version) {
        return getVersionedLinks(version);
    }

    return (windows ?? []).map(({ title, link }) => ({ title: title(), href: link }));
};
