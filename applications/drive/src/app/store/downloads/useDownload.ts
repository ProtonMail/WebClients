import { ReadableStream } from 'web-streams-polyfill';

import { DriveFileRevisionResult, DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { queryFileRevision } from '@proton/shared/lib/api/drive/files';

import { useDebouncedRequest } from '../api';
import { useDriveCrypto } from '../crypto';
import { DecryptedLink, LinkType, useLink, useLinksListing } from '../links';
import initDownloadPure, { initDownloadStream } from './download/download';
import downloadThumbnailPure from './download/downloadThumbnail';
import {
    LinkDownload,
    DownloadControls,
    DownloadStreamControls,
    DownloadEventCallbacks,
    Pagination,
} from './interface';

/**
 * useDownload provides pure initDownload enhanced by retrieving information
 * about user's own folders and files from the app cache. If data is missing
 * in the app cache, it is downloaded from the server.
 */
export default function useDownload() {
    const debouncedRequest = useDebouncedRequest();
    const { getPrimaryAddressKeys } = useDriveCrypto();
    const { getLink, getLinkPrivateKey, getLinkSessionKey } = useLink();
    const { loadChildren, getCachedChildren } = useLinksListing();

    const getChildren = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<DecryptedLink[]> => {
        await loadChildren(abortSignal, shareId, linkId);
        const { links } = getCachedChildren(abortSignal, shareId, linkId);
        return links;
    };

    const getBlocks = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        pagination: Pagination
    ): Promise<DriveFileBlock[]> => {
        let link = await getLink(abortSignal, shareId, linkId);
        const revisionId = link.activeRevision?.id;
        if (!revisionId) {
            throw new Error(`Invalid link metadata, expected File (${LinkType.FILE}), got ${link.type}`);
        }

        const { Revision } = await debouncedRequest<DriveFileRevisionResult>({
            ...queryFileRevision(shareId, linkId, revisionId, pagination),
            signal: abortSignal,
        });
        return Revision.Blocks;
    };

    const getKeys = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const [privateKey, sessionKey] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, linkId),
            getLinkSessionKey(abortSignal, shareId, linkId),
        ]);

        if (!sessionKey) {
            throw new Error('Session key missing on file link');
        }

        const addressPublicKeys = (await getPrimaryAddressKeys()).map(({ publicKey }) => publicKey);
        return {
            privateKey: privateKey,
            sessionKeys: sessionKey,
            addressPublicKeys,
        };
    };

    const initDownload = (
        name: string,
        list: LinkDownload[],
        eventCallbacks: DownloadEventCallbacks
    ): DownloadControls => {
        return initDownloadPure(name, list, {
            getChildren,
            getBlocks,
            getKeys,
            ...eventCallbacks,
        });
    };

    const downloadStream = (
        list: LinkDownload[],
        eventCallbacks?: DownloadEventCallbacks
    ): { controls: DownloadStreamControls; stream: ReadableStream<Uint8Array> } => {
        const controls = initDownloadStream(list, {
            getChildren,
            getBlocks,
            getKeys,
            ...eventCallbacks,
        });
        const stream = controls.start();
        return { controls, stream };
    };

    const downloadThumbnail = (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        url: string,
        token: string
    ) => {
        return downloadThumbnailPure(url, token, () => getKeys(abortSignal, shareId, linkId));
    };

    return {
        initDownload,
        downloadStream,
        downloadThumbnail,
    };
}
