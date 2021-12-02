import { ReadableStream } from 'web-streams-polyfill';

import { LinkType, LinkMeta } from '@proton/shared/lib/interfaces/drive/link';
import { DriveFileRevisionResult, DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { queryFileRevision } from '@proton/shared/lib/api/drive/files';

import useDrive from '../../hooks/drive/useDrive';
import useDriveCrypto from '../../hooks/drive/useDriveCrypto';
import useDebouncedRequest from '../../hooks/util/useDebouncedRequest';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
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
    const cache = useDriveCache();
    const { getLinkMeta, getLinkKeys, fetchAllFolderPages } = useDrive();
    const { getPrimaryAddressKeys } = useDriveCrypto();
    const debouncedRequest = useDebouncedRequest();

    const getChildren = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<LinkMeta[]> => {
        await fetchAllFolderPages(shareId, linkId);
        return cache.get.childLinkMetas(shareId, linkId) || [];
    };

    const getBlocks = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        pagination: Pagination
    ): Promise<DriveFileBlock[]> => {
        let fileMeta = await getLinkMeta(shareId, linkId, { abortSignal });
        if (!fileMeta.FileProperties?.ActiveRevision) {
            fileMeta = await getLinkMeta(shareId, linkId, { skipCache: true, abortSignal });
        }

        const revisionId = fileMeta.FileProperties?.ActiveRevision?.ID;
        if (!revisionId) {
            throw new Error(`Invalid link metadata, expected File (${LinkType.FILE}), got ${fileMeta.Type}`);
        }

        const { Revision } = await debouncedRequest<DriveFileRevisionResult>({
            ...queryFileRevision(shareId, linkId, revisionId, pagination),
            signal: abortSignal,
        });
        return Revision.Blocks;
    };

    const getKeys = async (shareId: string, linkId: string) => {
        const keys = await getLinkKeys(shareId, linkId);
        if (!('sessionKeys' in keys)) {
            throw new Error('Session key missing on file link');
        }

        const addressPublicKeys = (await getPrimaryAddressKeys()).map(({ publicKey }) => publicKey);

        return {
            privateKey: keys.privateKey,
            sessionKeys: keys.sessionKeys,
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

    const downloadThumbnail = (shareId: string, linkId: string, url: string, token: string) => {
        return downloadThumbnailPure(url, token, () => getKeys(shareId, linkId));
    };

    return {
        initDownload,
        downloadStream,
        downloadThumbnail,
    };
}
