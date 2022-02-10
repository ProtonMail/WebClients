import { generateLookupHash } from '@proton/shared/lib/keys/driveKeys';
import { range } from '@proton/shared/lib/helpers/array';
import { queryCheckAvailableHashes } from '@proton/shared/lib/api/drive/link';
import { HashCheckResult } from '@proton/shared/lib/interfaces/drive/link';

import { useDebouncedRequest } from '../../api';
import { useLink, useLinksListing, adjustName, splitLinkName } from '../../links';

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
            const { AvailableHashes } = await debouncedRequest<HashCheckResult>(
                queryCheckAvailableHashes(shareId, parentLinkID, { Hashes }, suppressErrors),
                abortSignal
            );
            if (!AvailableHashes.length) {
                return findAdjustedName(start + HASH_CHECK_AMOUNT);
            }
            const availableName = hashesToCheck.find(({ hash }) => hash === AvailableHashes[0]);

            if (!availableName) {
                throw new Error('Backend returned unexpected hash');
            }
            return availableName;
        };
        return findAdjustedName();
    };

    const getLinkByName = async (abortSignal: AbortSignal, shareId: string, parentLinkID: string, name: string) => {
        await loadChildren(abortSignal, shareId, parentLinkID);
        const [children] = getCachedChildren(abortSignal, shareId, parentLinkID);
        return children?.find((link) => link.name === name);
    };

    return {
        findAvailableName,
        getLinkByName,
    };
}
