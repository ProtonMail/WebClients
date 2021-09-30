import { generateLookupHash } from '@proton/shared/lib/keys/driveKeys';
import { range } from '@proton/shared/lib/helpers/array';

import { queryCheckAvailableHashes } from '@proton/shared/lib/api/drive/link';
import { HashCheckResult } from '@proton/shared/lib/interfaces/drive/link';
import useDrive from '../../../hooks/drive/useDrive';
import useDebouncedRequest from '../../../hooks/util/useDebouncedRequest';
import { adjustName, splitLinkName } from '../../../utils/link';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import { callWithAbortSignal } from '../utils';

const HASH_CHECK_AMOUNT = 10;

export default function useUploadHelper() {
    const cache = useDriveCache();
    const { fetchAllFolderPages, getLinkKeys } = useDrive();

    const debouncedRequest = useDebouncedRequest();

    const findAvailableName = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkID: string,
        filename: string,
        suppressErrors = false
    ) => {
        const parentKeys = await getLinkKeys(shareId, parentLinkID);

        if (!('hashKey' in parentKeys)) {
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
                        hash: await generateLookupHash(adjustedFileName, parentKeys.hashKey),
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
        // Its fine to abort sooner and leave the original function to finish.
        // It just fills the cache with the children of the folder.
        await callWithAbortSignal(abortSignal, () => fetchAllFolderPages(shareId, parentLinkID));
        const children = cache.get.childLinkMetas(shareId, parentLinkID);
        return children?.find((link) => link.Name === name);
    };

    return {
        findAvailableName,
        getLinkByName,
    };
}
