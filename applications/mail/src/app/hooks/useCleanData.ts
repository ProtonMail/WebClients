import { useCallback } from 'react';

import { useUser } from '@proton/account/user/hooks';

import { useEncryptedSearchContext } from '../containers/EncryptedSearchProvider';
import type { CleanDataOptions } from '../helpers/cleanData';
import { cleanData } from '../helpers/cleanData';

interface Options extends Omit<CleanDataOptions, 'esDelete'> {
    /** v1 encrypted search database, wiped through the ES context's own teardown */
    encryptedSearch?: boolean;
}

/**
 * React-bound wrapper around {@link cleanData}: injects the current user and the ES teardown.
 * Module-level callers such as the logout listener have no React context, so they call
 * `cleanData` directly and cannot wipe the encrypted search database.
 */
export const useCleanData = () => {
    const [user] = useUser();
    const { esDelete } = useEncryptedSearchContext();

    return useCallback(
        (options: Options) => {
            return cleanData(user.ID, { ...options, esDelete: options.encryptedSearch ? esDelete : undefined });
        },
        [user.ID, esDelete]
    );
};
