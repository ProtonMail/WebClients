import { ReadableStream } from 'web-streams-polyfill';

import { querySharedURLFileRevision } from '@proton/shared/lib/api/drive/sharing';
import { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { SharedURLRevision, ThumbnailURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';

import { usePublicSession } from '../_api';
import { DecryptedLink, useLink, usePublicLinksListing } from '../_links';
import initDownloadPure, { initDownloadStream } from './download/download';
import downloadThumbnailPure from './download/downloadThumbnail';
import {
    DownloadControls,
    DownloadEventCallbacks,
    DownloadStreamControls,
    LinkDownload,
    Pagination,
} from './interface';

/**
 * usePublicDownload provides pure initDownload enhanced by retrieving
 * information about user's own folders and files from the app cache
 * similarly like useDownload for private app, but this one is for public
 * sessions.
 */
export default function usePublicDownload() {
    const { request } = usePublicSession();
    const { getLinkPrivateKey, getLinkSessionKey } = useLink();
    const { loadChildren, getCachedChildren } = usePublicLinksListing();

    const getChildren = async (abortSignal: AbortSignal, token: string, linkId: string): Promise<DecryptedLink[]> => {
        await loadChildren(abortSignal, token, linkId, false);
        const { links } = getCachedChildren(abortSignal, token, linkId);
        return links;
    };

    const getBlocks = async (
        abortSignal: AbortSignal,
        token: string,
        linkId: string,
        pagination: Pagination
    ): Promise<{ blocks: DriveFileBlock[]; thumbnailHashes: string[]; manifestSignature: string }> => {
        const { Revision } = await request<{ Revision: SharedURLRevision }>(
            querySharedURLFileRevision(token, linkId, pagination),
            abortSignal
        );
        return {
            blocks: Revision.Blocks,
            thumbnailHashes: Revision.Thumbnails.map((Thumbnail) => Thumbnail.Hash),
            manifestSignature: Revision.ManifestSignature,
        };
    };

    const getKeys = async (abortSignal: AbortSignal, token: string, linkId: string) => {
        const [privateKey, sessionKeys] = await Promise.all([
            getLinkPrivateKey(abortSignal, token, linkId),
            getLinkSessionKey(abortSignal, token, linkId),
        ]);

        if (!sessionKeys) {
            throw new Error('Session key missing on file link');
        }

        return {
            privateKey,
            sessionKeys,
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
            getKeys: (abortSignal: AbortSignal, link: LinkDownload) =>
                getKeys(
                    abortSignal,
                    link.shareId, // Token in this context.
                    link.linkId
                ),
            ...eventCallbacks,
            onSignatureIssue: undefined,
        });
    };

    const downloadThumbnail = async (
        abortSignal: AbortSignal,
        token: string,
        linkId: string,
        params: ThumbnailURLInfo
    ) => {
        const privateKey = await getLinkPrivateKey(abortSignal, token, linkId);
        const sessionKey = await getLinkSessionKey(abortSignal, token, linkId);

        if (!privateKey || !sessionKey) {
            throw new Error('No keys found to decrypt the thumbnail');
        }

        const { contents } = await downloadThumbnailPure(params.BareURL, params.Token, async () => ({
            sessionKeys: sessionKey,
            privateKey,
            addressPublicKeys: [],
        }));

        return contents;
    };

    const downloadStream = (
        list: LinkDownload[],
        eventCallbacks?: DownloadEventCallbacks
    ): { controls: DownloadStreamControls; stream: ReadableStream<Uint8Array> } => {
        const controls = initDownloadStream(list, {
            getChildren,
            getBlocks,
            getKeys: async (abortSignal: AbortSignal, link: LinkDownload) => {
                return getKeys(abortSignal, link.shareId, link.linkId);
            },
            ...eventCallbacks,
        });
        const stream = controls.start();
        return { controls, stream };
    };

    return {
        initDownload,
        downloadThumbnail,
        downloadStream,
    };
}
