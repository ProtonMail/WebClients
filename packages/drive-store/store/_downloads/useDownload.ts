import { useApi } from '@proton/app-context/useApi';
import { queryFileRevision } from '@proton/shared/lib/api/drive/files';
import { querySharedURLFileRevision, querySharedURLSecurity } from '@proton/shared/lib/api/drive/sharing';
import type { DriveFileBlock, DriveFileRevisionResult } from '@proton/shared/lib/interfaces/drive/file';
import type { SharedFileScan } from '@proton/shared/lib/interfaces/drive/sharing';

import { TransferState } from '../../components/TransferManager/transfer';
import { usePublicShareStore } from '../../zustand/public/public-share.store';
import useDebouncedRequest from '../_api/useDebouncedRequest';
import useDriveCrypto from '../_crypto/useDriveCrypto';
import type { DecryptedLink, SignatureIssues } from '../_links/interface';
import useLink from '../_links/useLink';
import { waitFor } from '../_utils';
import { useDownloadMetrics } from './DownloadProvider/useDownloadMetrics';
import { initDownloadStream } from './download/download';
import type {
    DecryptFileKeys,
    DownloadEventCallbacks,
    DownloadStreamControls,
    LinkDownload,
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

    return {
        downloadStream,
    };
}
