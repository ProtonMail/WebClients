import { Sha1 } from '@openpgp/asmcrypto.js/dist_es8/hash/sha1/sha1';
import { ReadableStream } from 'web-streams-polyfill';

import { arrayToHexString } from '@proton/crypto/lib/utils';
import { queryCheckAvailableHashes } from '@proton/shared/lib/api/drive/link';
import { queryPhotosDuplicates } from '@proton/shared/lib/api/drive/photos';
import { HashCheckResult, LinkState } from '@proton/shared/lib/interfaces/drive/link';
import { DuplicatePhotosHash } from '@proton/shared/lib/interfaces/drive/photos';
import { generateLookupHash } from '@proton/shared/lib/keys/driveKeys';
import range from '@proton/utils/range';

import { untilStreamEnd } from '../../../utils/stream';
import { useDebouncedRequest } from '../../_api';
import { adjustName, splitLinkName, useLink, useLinksListing } from '../../_links';
import { isClientUidAvailable } from './uploadClientUid';

const HASH_CHECK_AMOUNT = 10;

export default function useUploadHelper() {
    const debouncedRequest = useDebouncedRequest();
    const { getLinkHashKey } = useLink();
    const { loadChildren, getCachedChildren } = useLinksListing();

    const findAvailableName = async (
        abortSignal: AbortSignal,
        {
            shareId,
            parentLinkId,
            filename,
            suppressErrors = false,
        }: { shareId: string; parentLinkId: string; filename: string; suppressErrors?: boolean }
    ) => {
        const parentHashKey = await getLinkHashKey(abortSignal, shareId, parentLinkId);
        if (!parentHashKey) {
            throw Error('Missing hash key on folder link');
        }

        const [namePart, extension] = splitLinkName(filename);
        const hash = await generateLookupHash(filename, parentHashKey);

        const findAdjustedName = async (
            start = 0
        ): Promise<{
            filename: string;
            hash: string;
            draftLinkId?: string;
            clientUid?: string;
        }> => {
            const hashesToCheck = await Promise.all(
                range(start, start + HASH_CHECK_AMOUNT).map(async (i) => {
                    if (i === 0) {
                        return {
                            filename,
                            hash,
                        };
                    }
                    const adjustedFileName = adjustName(i, namePart, extension);
                    return {
                        filename: adjustedFileName,
                        hash: await generateLookupHash(adjustedFileName, parentHashKey),
                    };
                })
            );

            const Hashes = hashesToCheck.map(({ hash }) => hash);
            const { AvailableHashes, PendingHashes } = await debouncedRequest<HashCheckResult>(
                queryCheckAvailableHashes(shareId, parentLinkId, { Hashes }, suppressErrors),
                abortSignal
            );

            // Check if pending drafts are created by this client and is safe
            // to automatically replace the draft without user interaction.
            const pendingAvailableHashes = PendingHashes.filter(({ ClientUID }) => isClientUidAvailable(ClientUID));
            if (pendingAvailableHashes.length) {
                const availableName = hashesToCheck.find(({ hash }) => hash === pendingAvailableHashes[0].Hash);
                if (availableName) {
                    return {
                        ...availableName,
                        draftLinkId: pendingAvailableHashes[0].LinkID,
                        clientUid: pendingAvailableHashes[0].ClientUID,
                    };
                }
            }

            if (!AvailableHashes.length) {
                return findAdjustedName(start + HASH_CHECK_AMOUNT);
            }
            const availableName = hashesToCheck.find(({ hash }) => hash === AvailableHashes[0]);

            if (!availableName) {
                throw new Error('Backend returned unexpected hash');
            }

            const draftHashes = PendingHashes.filter(({ ClientUID }) => !isClientUidAvailable(ClientUID));
            const draftLinkId = draftHashes.find(({ Hash }) => Hash === hash)?.LinkID;

            return {
                ...availableName,
                draftLinkId,
            };
        };
        return findAdjustedName();
    };

    /**
     * Checks if there is a Photos file with the same Hash and ContentHash
     */
    const findDuplicateContentHash = async (
        abortSignal: AbortSignal,
        {
            file,
            volumeId,
            shareId,
            parentLinkId,
        }: { file: File; volumeId: string; shareId: string; parentLinkId: string }
    ): Promise<{
        filename: string;
        hash: string;
        draftLinkId?: string;
        clientUid?: string;
        isDuplicatePhotos?: boolean;
    }> => {
        const parentHashKey = await getLinkHashKey(abortSignal, shareId, parentLinkId);
        if (!parentHashKey) {
            throw Error('Missing hash key on folder link');
        }
        const hash = await generateLookupHash(file.name, parentHashKey);

        // Force polyfill type for ReadableStream
        const fileStream = file.stream() as ReadableStream<Uint8Array>;
        const sha1 = new Sha1();
        await untilStreamEnd<Uint8Array>(fileStream, async (chunk) => {
            if (chunk?.buffer) {
                sha1.process(new Uint8Array(chunk.buffer));
            }
        });

        const sha1Hash = sha1.finish().result;

        if (sha1Hash) {
            const contentHash = await generateLookupHash(arrayToHexString(sha1Hash), parentHashKey);
            const checkHash = await debouncedRequest<{ DuplicateHashes: DuplicatePhotosHash[] }>(
                queryPhotosDuplicates(volumeId, {
                    nameHashes: [hash],
                }),
                abortSignal
            );

            const duplicatePhotoHashDraft = checkHash.DuplicateHashes.find(
                (duplicatePhotosHash) => duplicatePhotosHash.LinkState === LinkState.DRAFT
            );
            if (duplicatePhotoHashDraft) {
                return {
                    filename: file.name,
                    hash,
                    draftLinkId: duplicatePhotoHashDraft.LinkID,
                    clientUid: isClientUidAvailable(duplicatePhotoHashDraft.ClientUID)
                        ? duplicatePhotoHashDraft.ClientUID
                        : undefined,
                };
            }

            const duplicatePhotoHashActive = checkHash.DuplicateHashes.find(
                (duplicatePhotosHash) =>
                    duplicatePhotosHash.ContentHash === contentHash &&
                    duplicatePhotosHash.LinkState === LinkState.ACTIVE
            );
            if (duplicatePhotoHashActive) {
                return {
                    filename: file.name,
                    hash,
                    isDuplicatePhotos: true,
                };
            }
        }
        return {
            filename: file.name,
            hash,
        };
    };

    const getLinkByName = async (abortSignal: AbortSignal, shareId: string, parentLinkID: string, name: string) => {
        await loadChildren(abortSignal, shareId, parentLinkID);
        const { links } = getCachedChildren(abortSignal, shareId, parentLinkID);
        return links?.find((link) => link.name === name);
    };

    return {
        findAvailableName,
        findDuplicateContentHash,
        getLinkByName,
    };
}
