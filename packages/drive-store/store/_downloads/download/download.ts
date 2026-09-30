import type { Api } from '@proton/shared/lib/interfaces';

import type { DownloadCallbacks, DownloadStreamControls, LinkDownload, LogCallback } from '../interface';
import initDownloadLinkFile from './downloadLinkFile';
import initDownloadLinkFolder from './downloadLinkFolder';
import initDownloadLinks from './downloadLinks';

export function initDownloadStream(links: LinkDownload[], callbacks: DownloadCallbacks, api: Api) {
    // Stream is used in direct preview. There we do not support logs just yet.
    const noLog = () => {};
    return getControls(links, callbacks, noLog, api);
}

function getControls(
    links: LinkDownload[],
    callbacks: DownloadCallbacks,
    log: LogCallback,
    api: Api,
    options?: { virusScan?: boolean }
): DownloadStreamControls {
    if (links.length === 1) {
        const link = links[0];
        if (link.isFile) {
            return initDownloadLinkFile(link, callbacks, log, options);
        }
        return initDownloadLinkFolder(link, callbacks, log, api, options);
    }
    return initDownloadLinks(links, callbacks, log, api, options);
}
