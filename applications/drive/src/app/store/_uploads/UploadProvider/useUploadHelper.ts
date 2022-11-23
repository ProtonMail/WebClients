import { queryCheckAvailableHashes } from '@proton/shared/lib/api/drive/link';
import { HashCheckResult } from '@proton/shared/lib/interfaces/drive/link';
import { generateLookupHash } from '@proton/shared/lib/keys/driveKeys';
import range from '@proton/utils/range';

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
        shareId: string,
        parentLinkID: string,
        filename: string,
        suppressErrors = false
    ) => {
        const parentHashKey = await getLinkHashKey(abortSignal, shareId, parentLinkID);
        if (!parentHashKey) {
            throw Error('Missing hash key on folder link');
        }

        const [namePart, extension] = splitLinkName(filename);

        const findAdjustedName = async (
            start = 0
        ): Promise<{
            filename: string;
            hash: string;
            linkId?: string;
            clientUid?: string;
            hasDraft?: boolean;
        }> => {
            const hashesToCheck = await Promise.all(
                range(start, start + HASH_CHECK_AMOUNT).map(async (i) => {
                    const adjustedFileName = adjustName(i, namePart, extension);
                    return {
                        filename: adjustedFileName,
                        hash: await generateLookupHash(adjustedFileName, parentHashKey),
                    };
                })
            );

            const Hashes = hashesToCheck.map(({ hash }) => hash);
            const { AvailableHashes, PendingHashes } = await debouncedRequest<HashCheckResult>(
                queryCheckAvailableHashes(shareId, parentLinkID, { Hashes }, suppressErrors),
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
                        linkId: pendingAvailableHashes[0].LinkID,
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
            const hasDraft = draftHashes.length > 0;

            return {
                ...availableName,
                hasDraft,
            };
        };
        return findAdjustedName();
    };

    const getLinkByName = async (abortSignal: AbortSignal, shareId: string, parentLinkID: string, name: string) => {
        await loadChildren(abortSignal, shareId, parentLinkID);
        const { links } = getCachedChildren(abortSignal, shareId, parentLinkID);
        return links?.find((link) => link.name === name);
    };

    return {
        findAvailableName,
        getLinkByName,
    };
}
