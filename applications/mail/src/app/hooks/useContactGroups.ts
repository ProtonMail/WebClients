import { useCallback } from 'react';
import { useApi, useCache, useCachedModelResult } from 'react-components';
import { getContactGroupsModel } from 'proton-shared/lib/models/contactGroupsModel';
import { ContactGroup } from '../models/contact';

/**
 * Temporary hook waiting for a solution about cache overriding in proton-shared
 * https://github.com/ProtonMail/proton-shared/pull/107
 * Workaround: manual use of the cache
 */
export const useContactGroups = () => {
    const api = useApi();
    const cache = useCache();

    return useCachedModelResult(
        cache,
        'ContactGroups',
        useCallback(() => getContactGroupsModel(api), [api])
    ) as [ContactGroup[], boolean, any];
};
