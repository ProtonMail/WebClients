import { c } from 'ttag';
import { ReadableStream } from 'web-streams-polyfill';

import { queryFileRevision, queryFileRevisionThumbnail } from '@proton/shared/lib/api/drive/files';
import {
    DriveFileBlock,
    DriveFileRevisionResult,
    DriveFileRevisionThumbnailResult,
} from '@proton/shared/lib/interfaces/drive/file';

import { streamToBuffer } from '../../utils/stream';
import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import { DecryptedLink, SignatureIssues, useLink, useLinksListing } from '../_links';
import { ThumbnailType } from '../_uploads/media';
import { waitFor } from '../_utils';
import initDownloadPure, { initDownloadStream } from './download/download';
import initDownloadLinkFile from './download/downloadLinkFile';
import downloadThumbnailPure from './download/downloadThumbnail';
import {
    DecryptFileKeys,
    DownloadControls,
    DownloadEventCallbacks,
    DownloadStreamControls,
    LinkDownload,
    OnSignatureIssueCallback,
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
        // Wait for all links to be loaded before getting them from cache
        await waitFor(() => !getCachedChildren(abortSignal, shareId, linkId).isDecrypting);
        const { links } = getCachedChildren(abortSignal, shareId, linkId);
        return links;
    };

    const getBlocks = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        pagination: Pagination,
        revisionId?: string
    ): Promise<{ blocks: DriveFileBlock[]; thumbnailHashes: string[]; manifestSignature: string }> => {
        let link = await getLink(abortSignal, shareId, linkId);
        revisionId ||= link.activeRevision?.id;
        if (!revisionId) {
            throw new Error(`Invalid link metadata, expected file`);
        }

        const { Revision } = await debouncedRequest<DriveFileRevisionResult>(
            queryFileRevision(shareId, linkId, revisionId, pagination),
            abortSignal
        );
        return {
            blocks: Revision.Blocks,
            // We sort hashes to have the Type 1 always at first place. This is necessary for signature verification.
            thumbnailHashes: Revision.Thumbnails.sort((a, b) => a.Type - b.Type).map((Thumbnail) => Thumbnail.Hash),
            manifestSignature: Revision.ManifestSignature,
        };
    };

    const getKeysWithSignatures = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        revisionId?: string
    ): Promise<[DecryptFileKeys, SignatureIssues?]> => {
        const [privateKey, sessionKey] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, linkId),
            getLinkSessionKey(abortSignal, shareId, linkId),
        ]);

        // Getting keys above might find signature issue. Lets get fresh link
        // after that (not in parallel) to have fresh signature issues on it.
        const link = await getLink(abortSignal, shareId, linkId);

        // We need to get address from the asked revision to prevent signature issues
        // This should be improved to prevent fetching the revision twice (see getBlocks)
        const revisionSignatureAddress =
            revisionId && revisionId !== link.activeRevision?.id
                ? await debouncedRequest<DriveFileRevisionResult>(
                      queryFileRevision(shareId, linkId, revisionId),
                      abortSignal
                  ).then(({ Revision }) => Revision.SignatureAddress)
                : link.activeRevision?.signatureAddress;

        if (!sessionKey) {
            throw new Error('Session key missing on file link');
        }
        if (!revisionSignatureAddress) {
            throw new Error('Signature address missing on file link');
        }

        const addressPublicKeys = await getVerificationKey(revisionSignatureAddress);
        return [
            {
                privateKey: privateKey,
                sessionKeys: sessionKey,
                addressPublicKeys,
            },
            link.signatureIssues,
        ];
    };

    /**
     * getKeysUnsafe only returns keys without checking signature issues.
     * Use only on places when its keys signatures are not important.
     */
    const getKeysUnsafe = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const [keys] = await getKeysWithSignatures(abortSignal, shareId, linkId);
        return keys;
    };

    const getKeysGenerator = (onSignatureIssue?: OnSignatureIssueCallback) => {
        return async (abortSignal: AbortSignal, link: LinkDownload) => {
            const [keys, signatureIssues] = await getKeysWithSignatures(
                abortSignal,
                link.shareId,
                link.linkId,
                link.revisionId
            );
            if (signatureIssues) {
                await onSignatureIssue?.(abortSignal, link, signatureIssues);
            }
            return keys;
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
            getKeys: getKeysGenerator(eventCallbacks.onSignatureIssue),
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
            getKeys: getKeysGenerator(eventCallbacks?.onSignatureIssue),
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
        return downloadThumbnailPure(url, token, () => getKeysUnsafe(abortSignal, shareId, linkId));
    };

    const checkFirstBlockSignature = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        revisionId?: string
    ) => {
        const link = await getLink(abortSignal, shareId, linkId);
        if (!link.isFile) {
            return;
        }
        return new Promise<SignatureIssues | undefined>((resolve, reject) => {
            const controls = initDownloadLinkFile(
                {
                    ...link,
                    revisionId,
                    shareId,
                },
                {
                    getChildren,
                    getBlocks: (abortSignal) =>
                        getBlocks(abortSignal, shareId, linkId, { FromBlockIndex: 1, PageSize: 1 }, revisionId),
                    getKeys: getKeysGenerator(),
                    onError: reject,
                    onNetworkError: reject,
                    onSignatureIssue: async (abortSignal, _link, signatureIssues) => {
                        // Ignore manifest as that needs to download the whole file.
                        if (signatureIssues.manifest) {
                            delete signatureIssues.manifest;
                            if (Object.entries(signatureIssues).length === 0) {
                                return;
                            }
                        }
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

    const getThumbnailFromBlobUrl = async (thumbnailUrl: string) => {
        return fetch(thumbnailUrl)
            .then((r) => r.blob())
            .then((blob) => blob.stream() as ReadableStream<Uint8Array>)
            .then((buffer) => streamToBuffer(buffer));
    };

    const getPreviewThumbnail = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const { activeRevision, cachedThumbnailUrl } = await getLink(abortSignal, shareId, linkId);
        if (!activeRevision?.id) {
            throw new Error(c('Error').t`The original file has missing active revision`);
        }

        const res = (await debouncedRequest(
            queryFileRevisionThumbnail(shareId, linkId, activeRevision.id, ThumbnailType.HD_PREVIEW),
            abortSignal
        ).catch((err) => {
            if (err.data.Code === 2501) {
                if (cachedThumbnailUrl) {
                    return;
                }
                return debouncedRequest(
                    queryFileRevisionThumbnail(shareId, linkId, activeRevision.id, ThumbnailType.PREVIEW)
                );
            }
            return err;
        })) as DriveFileRevisionThumbnailResult;
        if (!res && cachedThumbnailUrl) {
            return getThumbnailFromBlobUrl(cachedThumbnailUrl);
        }
        const thumbnail = await downloadThumbnail(
            abortSignal,
            shareId,
            linkId,
            res.ThumbnailBareURL,
            res.ThumbnailToken
        );
        return thumbnail.contents;
    };

    return {
        initDownload,
        downloadStream,
        downloadThumbnail,
        getPreviewThumbnail,
        checkFirstBlockSignature,
    };
}
