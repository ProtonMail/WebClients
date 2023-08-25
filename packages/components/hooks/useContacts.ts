import { useCallback } from 'react';

import { Contact } from '@proton/shared/lib/interfaces/contacts';
import { GetContacts } from '@proton/shared/lib/interfaces/hooks/GetContacts';
import { ContactsModel } from '@proton/shared/lib/models/contactsModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const useGetContacts = (): GetContacts => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => ContactsModel.get(api), [api]);
    return useCallback(() => {
        return getPromiseValue(cache, ContactsModel.key, miss);
    }, [cache, miss]);
};

export const useContacts = (): [result: Contact[] | undefined, loading: boolean, error: any] => {
    const cache = useCache();
    const miss = useGetContacts();
    return useCachedModelResult(cache, ContactsModel.key, miss);
};

export default useContacts;
