import { ReadableStream } from 'web-streams-polyfill';

import { DriveFileRevisionResult, DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { queryFileRevision } from '@proton/shared/lib/api/drive/files';

import { streamToBuffer } from '../../utils/stream';
import { useDebouncedRequest } from '../api';
import { useDriveCrypto } from '../crypto';
import { DecryptedLink, SignatureIssues, useLink, useLinksListing } from '../links';
import initDownloadPure, { initDownloadStream } from './download/download';
import initDownloadLinkFile from './download/downloadLinkFile';
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
    const { getVerificationKey } = useDriveCrypto();
    const { getLink, getLinkPrivateKey, getLinkSessionKey, setSignatureIssues } = useLink();
    const { loadChildren, getCachedChildren } = useLinksListing();

    const getChildren = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<DecryptedLink[]> => {
        await loadChildren(abortSignal, shareId, linkId, false, false);
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
            throw new Error(`Invalid link metadata, expected file`);
        }

        const { Revision } = await debouncedRequest<DriveFileRevisionResult>({
            ...queryFileRevision(shareId, linkId, revisionId, pagination),
            signal: abortSignal,
        });
        return Revision.Blocks;
    };

    const getKeys = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const [link, privateKey, sessionKey] = await Promise.all([
            getLink(abortSignal, shareId, linkId),
            getLinkPrivateKey(abortSignal, shareId, linkId),
            getLinkSessionKey(abortSignal, shareId, linkId),
        ]);

        if (!sessionKey) {
            throw new Error('Session key missing on file link');
        }
        if (!link.activeRevision?.signatureAddress) {
            throw new Error('Signature address missing on file link');
        }

        const addressPublicKeys = await getVerificationKey(link.activeRevision?.signatureAddress);
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
            onSignatureIssue: async (abortSignal, link, signatureIssues) => {
                await setSignatureIssues(abortSignal, link.shareId, link.linkId, signatureIssues);
                return eventCallbacks.onSignatureIssue?.(abortSignal, link, signatureIssues);
            },
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
            onSignatureIssue: async (abortSignal, link, signatureIssues) => {
                await setSignatureIssues(abortSignal, link.shareId, link.linkId, signatureIssues);
                return eventCallbacks?.onSignatureIssue?.(abortSignal, link, signatureIssues);
            },
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

    const checkFirstBlockSignature = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const link = await getLink(abortSignal, shareId, linkId);
        if (!link.isFile) {
            return;
        }
        return new Promise<SignatureIssues | undefined>((resolve, reject) => {
            const controls = initDownloadLinkFile(
                {
                    ...link,
                    shareId,
                },
                {
                    getChildren,
                    getBlocks: (abortSignal) =>
                        getBlocks(abortSignal, shareId, linkId, { FromBlockIndex: 1, PageSize: 1 }),
                    getKeys,
                    onError: reject,
                    onNetworkError: reject,
                    onSignatureIssue: async (abortSignal, link, signatureIssues) => {
                        await setSignatureIssues(abortSignal, shareId, linkId, signatureIssues);
                        resolve(signatureIssues);
                    },
                }
            );
            abortSignal.addEventListener('abort', () => {
                controls.cancel();
            });
            streamToBuffer(controls.start())
                .then(() => resolve(undefined))
                .catch(reject);
        });
    };

    return {
        initDownload,
        downloadStream,
        downloadThumbnail,
        checkFirstBlockSignature,
    };
}
