import { useFetchDownloadLinks } from './useFetchDownloadLinks';

/** Where to send users when no individual Windows build can be resolved. */
export const WINDOWS_DOWNLOAD_PAGE = 'https://protonvpn.com/download-windows/';
const FETCH_FROM_API = true;
/**
 * The latest Windows client builds, from the same source as the Downloads page: the download API when
 * `DesktopDownloadApiEnabled` is on, a hardcoded list of the latest builds otherwise.
 *
 * Empty while the API request is in flight, and if it fails.
 */
export const useWindowsDownloadLinks = () => {
    const { windows } = useFetchDownloadLinks(FETCH_FROM_API);

    return (windows ?? []).map(({ title, link }) => ({ title: title(), href: link }));
};
