import { c } from 'ttag';

import { useApi } from '@proton/components';
import { queryFileRevision, queryFileRevisionThumbnail } from '@proton/shared/lib/api/drive/files';
import { querySharedURLFileRevision, querySharedURLSecurity } from '@proton/shared/lib/api/drive/sharing';
import type {
    DriveFileBlock,
    DriveFileRevisionResult,
    DriveFileRevisionThumbnailResult,
} from '@proton/shared/lib/interfaces/drive/file';
import { type SharedFileScan } from '@proton/shared/lib/interfaces/drive/sharing';

import { TransferState } from '../../components/TransferManager/transfer';
import { logError } from '../../utils/errorHandling';
import { streamToBuffer } from '../../utils/stream';
import { getCacheKey, useThumbnailCacheStore } from '../../zustand/download/thumbnail.store';
import { usePublicShareStore } from '../../zustand/public/public-share.store';
import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import type { DecryptedLink, SignatureIssues } from '../_links';
import { useLink } from '../_links';
import { decryptExtendedAttributes } from '../_links/extendedAttributes';
import { ThumbnailType } from '../_uploads/media';
import { waitFor } from '../_utils';
import useDownloadDecryptionIssue from './DownloadProvider/useDownloadDecryptionIssue';
import { useDownloadMetrics } from './DownloadProvider/useDownloadMetrics';
import initDownloadPure, { initDownloadStream } from './download/download';
import initDownloadLinkFile from './download/downloadLinkFile';
import { downloadThumbnailPure } from './download/downloadThumbnailPure';
import type {
    DecryptFileKeys,
    DownloadControls,
    DownloadEventCallbacks,
    DownloadStreamControls,
    LinkDownload,
    LogCallback,
    OnSignatureIssueCallback,
    Pagination,
} from './interface';

export interface UseDownloadProps {
    customDebouncedRequest?: <T>(args: object, abortSignal?: AbortSignal) => Promise<T>;
    loadChildren: (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        foldersOnly?: boolean,
        showNotification?: boolean,
        showAll?: boolean
    ) => Promise<void>;
    getCachedChildren: (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        foldersOnly?: boolean
    ) => {
        links: DecryptedLink[];
        isDecrypting: boolean;
    };
}

/**
 * useDownload provides pure initDownload enhanced by retrieving information
 * about user's own folders and files from the app cache. If data is missing
 * in the app cache, it is downloaded from the server.
 */
export default function useDownload({ customDebouncedRequest, loadChildren, getCachedChildren }: UseDownloadProps) {
    const defaultDebouncedRequest = useDebouncedRequest();
    const debouncedRequest = customDebouncedRequest || defaultDebouncedRequest;
    const { getVerificationKey } = useDriveCrypto();
    const { getLink, getLinkPrivateKey, getLinkSessionKey, setSignatureIssues } = useLink();
    const { report } = useDownloadMetrics('preview');
    const { handleDecryptionIssue } = useDownloadDecryptionIssue();
    const { getThumbnail, addThumbnail } = useThumbnailCacheStore();
    const { publicShare, viewOnly } = usePublicShareStore((state) => ({
        publicShare: state.publicShare,
        viewOnly: state.viewOnly,
    }));
    const isPublicContext = !!publicShare;

    const api = useApi();

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
    ): Promise<{ blocks: DriveFileBlock[]; thumbnailHashes: string[]; manifestSignature: string; xAttr: string }> => {
        let Revision: DriveFileRevisionResult['Revision'];
        if (isPublicContext) {
            Revision = (
                await debouncedRequest<DriveFileRevisionResult>(
                    querySharedURLFileRevision(shareId, linkId, pagination),
                    abortSignal
                )
            ).Revision;
        } else {
            const link = await getLink(abortSignal, shareId, linkId);

            revisionId ||= link.activeRevision?.id;
            if (!revisionId) {
                throw new Error(`Invalid link metadata, expected file`);
            }

            Revision = (
                await debouncedRequest<DriveFileRevisionResult>(
                    queryFileRevision(shareId, linkId, revisionId, pagination),
                    abortSignal
                )
            ).Revision;
        }
        return {
            blocks: Revision.Blocks,
            // We sort hashes to have the Type 1 always at first place. This is necessary for signature verification.
            thumbnailHashes: Revision.Thumbnails.sort((a, b) => a.Type - b.Type).map((Thumbnail) => Thumbnail.Hash),
            manifestSignature: Revision.ManifestSignature,
            xAttr: Revision.XAttr,
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

        // If we are in viewOnly mode on public page we ignore signature as we can't check
        if (viewOnly) {
            return [
                {
                    privateKey: privateKey,
                    sessionKeys: sessionKey,
                },
            ];
        }

        // Getting keys above might find signature issue. Lets get fresh link
        // after that (not in parallel) to have fresh signature issues on it.
        const link = await getLink(abortSignal, shareId, linkId);

        // We need to get address from the asked revision to prevent signature issues
        // This should be improved to prevent fetching the revision twice (see getBlocks)
        const revisionSignatureAddress =
            revisionId && revisionId !== link.activeRevision?.id
                ? await debouncedRequest<DriveFileRevisionResult>(
                      isPublicContext
                          ? querySharedURLFileRevision(shareId, linkId)
                          : queryFileRevision(shareId, linkId, revisionId),
                      abortSignal
                  ).then(({ Revision }) => Revision.SignatureAddress)
                : link.activeRevision?.signatureEmail;

        if (!sessionKey) {
            throw new Error('Session key missing on file link');
        }

        const addressPublicKeys = !link.isAnonymous ? await getVerificationKey(revisionSignatureAddress) : undefined;

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

    const scanFilesHash = async (
        abortSignal: AbortSignal,
        { hashes }: { hashes: string[] }
    ): Promise<SharedFileScan | undefined> => {
        const token = publicShare?.sharedUrlInfo.token;
        if (!token) {
            return undefined;
        }
        const checkResult = await debouncedRequest<SharedFileScan>(querySharedURLSecurity(token, hashes), abortSignal);

        return checkResult;
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
                getKeys: getKeysGenerator(eventCallbacks.onSignatureIssue),
                ...eventCallbacks,
                onSignatureIssue: async (abortSignal, link, signatureIssues) => {
                    await setSignatureIssues(abortSignal, link.shareId, link.linkId, signatureIssues);
                    return eventCallbacks.onSignatureIssue?.(abortSignal, link, signatureIssues);
                },
                scanFilesHash: (abortSignal, hashes) => scanFilesHash(abortSignal, { hashes }),
            },
            log,
            api,
            options
        );
    };

    const downloadStream = (
        link: LinkDownload,
        eventCallbacks?: DownloadEventCallbacks
    ): { controls: DownloadStreamControls; stream: ReadableStream<Uint8Array<ArrayBuffer>> } => {
        const controls = initDownloadStream(
            [link],
            {
                getChildren,
                getBlocks,
                getKeys: getKeysGenerator(eventCallbacks?.onSignatureIssue),
                ...eventCallbacks,
                onSignatureIssue: async (abortSignal, link, signatureIssues) => {
                    await setSignatureIssues(abortSignal, link.shareId, link.linkId, signatureIssues);
                    return eventCallbacks?.onSignatureIssue?.(abortSignal, link, signatureIssues);
                },
                onError: (error: Error) => {
                    if (error) {
                        report(link.shareId, TransferState.Error, link.size, error);
                    }
                },
                onFinish: () => {
                    report(link.shareId, TransferState.Done, link.size);
                },
                scanFilesHash: (abortSignal, hashes) => scanFilesHash(abortSignal, { hashes }),
            },
            api
        );
        const stream = controls.start();
        return { controls, stream };
    };

    const downloadThumbnail = (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        url: string,
        token: string,
        activeRevisionId?: string
    ) => {
        const cacheKey = getCacheKey(linkId, shareId, activeRevisionId);
        return downloadThumbnailPure(
            url,
            token,
            () => getKeysUnsafe(abortSignal, shareId, linkId),
            () => {
                return getThumbnail(cacheKey);
            },
            (data: Uint8Array<ArrayBuffer>) => {
                void addThumbnail(cacheKey, data);
            }
        );
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
                    onDecryptionIssue: (link: LinkDownload) => {
                        handleDecryptionIssue(link);
                    },
                },
                () => {} // We do not support logging for thumnbails just yet.
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
            .then((blob) => blob.stream() as ReadableStream<Uint8Array<ArrayBuffer>>)
            .then((buffer) => streamToBuffer(buffer));
    };

    /**
     * getPreviewThumbnail is used to get thumbnail to preview a non-supported picture file format.
     * It will first try to retrieve the HD thumbnail before fallback on default one
     */
    const getPreviewThumbnail = async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
        const { hasThumbnail, hasHdThumbnail, activeRevision, cachedThumbnailUrl } = await getLink(
            abortSignal,
            shareId,
            linkId
        );
        if (!activeRevision?.id) {
            throw new Error(c('Error').t`The original file has missing active revision`);
        }

        if (!hasThumbnail) {
            return;
        }
        const res = (await debouncedRequest(
            queryFileRevisionThumbnail(
                shareId,
                linkId,
                activeRevision.id,
                hasHdThumbnail ? ThumbnailType.HD_PREVIEW : ThumbnailType.PREVIEW
            ),
            abortSignal
        ).catch((err) => {
            // We don't want to log the error if we can't find the HD_PREVIEW for photos, we just fallback to normal one
            if (err.data.Code !== 2501 && !hasThumbnail) {
                logError(err);
            }
            if (cachedThumbnailUrl) {
                return;
            }
            return debouncedRequest(
                queryFileRevisionThumbnail(shareId, linkId, activeRevision.id, ThumbnailType.PREVIEW)
            );
        })) as DriveFileRevisionThumbnailResult;
        if (!res && cachedThumbnailUrl) {
            return getThumbnailFromBlobUrl(cachedThumbnailUrl);
        }
        const thumbnail = await downloadThumbnail(
            abortSignal,
            shareId,
            linkId,
            res.ThumbnailBareURL,
            res.ThumbnailToken,
            activeRevision.id
        );
        return thumbnail.contents;
    };

    const getVideoData = async (abortSignal: AbortSignal, shareId: string, linkId: string, pagination: Pagination) => {
        const { blocks, xAttr, manifestSignature } = await getBlocks(abortSignal, shareId, linkId, pagination);
        const [keys] = await getKeysWithSignatures(abortSignal, shareId, linkId);
        const { xattrs } = await decryptExtendedAttributes(xAttr, keys.privateKey, keys.addressPublicKeys || []);
        return {
            blocks,
            xAttr: xattrs,
            manifestSignature,
        };
    };

    // Attention, this ignore signature issues, it's okey since it's just downloading certain blocks and not verifying the entire content
    // Must be used for Video Streaming (or other type of streaming) only
    const downloadSlices = (
        link: LinkDownload,
        blocks: DriveFileBlock[],
        manifestSignature: string
    ): { controls: DownloadStreamControls; stream: ReadableStream<Uint8Array<ArrayBuffer>> } => {
        const controls = initDownloadStream(
            [link],
            {
                getChildren,
                getBlocks: async () =>
                    Promise.resolve({
                        blocks,
                        thumbnailHashes: [],
                        manifestSignature: manifestSignature,
                        xAttr: '',
                    }),
                getKeys: getKeysGenerator(),
                onSignatureIssue: async () => {
                    // downloadSlices is used for Video Streaming only (so far)
                    // We do not care of signature issues on random blocks
                },
                onError: (error: Error) => {
                    if (error) {
                        report(link.shareId, TransferState.Error, link.size, error);
                    }
                },
                onFinish: () => {
                    report(link.shareId, TransferState.Done, link.size);
                },
            },
            api
        );
        const stream = controls.start(true);
        return { controls, stream };
    };

    return {
        initDownload,
        downloadStream,
        downloadThumbnail,
        getPreviewThumbnail,
        checkFirstBlockSignature,
        getVideoData,
        downloadSlices,
    };
}
