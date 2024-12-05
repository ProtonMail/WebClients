import { queryPublicCheckAvailableHashes } from '@proton/shared/lib/api/drive/link';
import type { HashCheckResult } from '@proton/shared/lib/interfaces/drive/link';
import { generateLookupHash } from '@proton/shared/lib/keys/driveKeys';
import range from '@proton/utils/range';

import { usePublicSession } from '../../_api';
import { adjustName, splitLinkName, useLink, usePublicLinksListing } from '../../_links';
import { isClientUidAvailable } from './uploadClientUid';

const HASH_CHECK_AMOUNT = 10;

export default function usePublicUploadHelper() {
    const { request: publicDebouncedRequest } = usePublicSession();
    const { getLinkHashKey } = useLink();
    const { loadChildren, getCachedChildren } = usePublicLinksListing();

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
            const { AvailableHashes, PendingHashes } = await publicDebouncedRequest<HashCheckResult>(
                queryPublicCheckAvailableHashes(shareId, parentLinkId, { Hashes }, suppressErrors),
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

    const getLinkByName = async (abortSignal: AbortSignal, shareId: string, parentLinkID: string, name: string) => {
        await loadChildren(abortSignal, shareId, parentLinkID);
        const { links } = getCachedChildren(abortSignal, shareId, parentLinkID);
        return links?.find((link) => link.name === name);
    };

    const findHash = async (
        abortSignal: AbortSignal,
        { shareId, parentLinkId, filename }: { shareId: string; parentLinkId: string; filename: string }
    ) => {
        const parentHashKey = await getLinkHashKey(abortSignal, shareId, parentLinkId);
        if (!parentHashKey) {
            throw Error('Missing hash key on folder link');
        }

        const hash = await generateLookupHash(filename, parentHashKey);

        return hash;
    };

    return {
        findAvailableName,
        findHash,
        getLinkByName,
    };
}
