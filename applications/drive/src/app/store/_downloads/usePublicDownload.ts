import type { ReadableStream } from 'web-streams-polyfill';

import { querySharedURLFileRevision, querySharedURLSecurity } from '@proton/shared/lib/api/drive/sharing';
import type { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import type { SharedFileScan, SharedURLRevision, ThumbnailURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import { useFlag } from '@proton/unleash';

import { usePublicSession } from '../_api';
import type { DecryptedLink } from '../_links';
import { useLink, usePublicLinksListing } from '../_links';
import initDownloadPure, { initDownloadStream } from './download/download';
import downloadThumbnailPure from './download/downloadThumbnail';
import type {
    DownloadControls,
    DownloadEventCallbacks,
    DownloadStreamControls,
    LinkDownload,
    LogCallback,
    Pagination,
} from './interface';

/**
 * usePublicDownload provides pure initDownload enhanced by retrieving
 * information about user's own folders and files from the app cache
 * similarly like useDownload for private app, but this one is for public
 * sessions.
 */
export default function usePublicDownload() {
    const { request, getSessionInfo } = usePublicSession();
    const { getLinkPrivateKey, getLinkSessionKey } = useLink();
    const { loadChildren, getCachedChildren } = usePublicLinksListing();

    // TODO: DRVWEB-4064 - Clean this up
    const isNewFolderTreeAlgorithmEnabled = useFlag('DriveWebDownloadNewFolderLoaderAlgorithm');
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
    ): Promise<{ blocks: DriveFileBlock[]; thumbnailHashes: string[]; manifestSignature: string; xAttr: string }> => {
        const { Revision } = await request<{ Revision: SharedURLRevision }>(
            querySharedURLFileRevision(token, linkId, pagination),
            abortSignal
        );
        return {
            blocks: Revision.Blocks,
            thumbnailHashes: Revision.Thumbnails.map((Thumbnail) => Thumbnail.Hash),
            manifestSignature: Revision.ManifestSignature,
            xAttr: Revision.XAttr,
        };
    };

    const scanFilesHash = async (abortSignal: AbortSignal, hashes: string[]): Promise<SharedFileScan | undefined> => {
        const sessionInfo = getSessionInfo();
        if (!sessionInfo) {
            return;
        }
        const checkResult = await request<SharedFileScan>(
            querySharedURLSecurity(sessionInfo.token, hashes),
            abortSignal
        );

        return checkResult;
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
        eventCallbacks: DownloadEventCallbacks,
        log: LogCallback,
        options?: { virusScan?: boolean }
    ): DownloadControls => {
        return initDownloadPure(
            name,
            list,
            {
                getChildren,
                getBlocks,
                getKeys: (abortSignal: AbortSignal, link: LinkDownload) =>
                    getKeys(
                        abortSignal,
                        link.shareId, // Token in this context.
                        link.linkId
                    ),
                scanFilesHash,
                ...eventCallbacks,
                onSignatureIssue: undefined,
            },
            log,
            isNewFolderTreeAlgorithmEnabled,
            request,
            options
        );
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
        link: LinkDownload,
        eventCallbacks?: DownloadEventCallbacks
    ): { controls: DownloadStreamControls; stream: ReadableStream<Uint8Array> } => {
        const controls = initDownloadStream(
            [link],
            {
                getChildren,
                getBlocks,
                getKeys: async (abortSignal: AbortSignal, link: LinkDownload) => {
                    return getKeys(abortSignal, link.shareId, link.linkId);
                },
                scanFilesHash,
                ...eventCallbacks,
            },
            isNewFolderTreeAlgorithmEnabled,
            request
        );
        const stream = controls.start();
        return { controls, stream };
    };

    return {
        initDownload,
        downloadThumbnail,
        downloadStream,
    };
}
