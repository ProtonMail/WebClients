import { useCallback } from 'react';

import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { GetContactEmails } from '@proton/shared/lib/interfaces/hooks/GetContactEmails';
import { ContactEmailsModel } from '@proton/shared/lib/models/contactEmailsModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';

export const useGetContactEmails = (): GetContactEmails => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => ContactEmailsModel.get(api), [api]);
    return useCallback(() => {
        return getPromiseValue(cache, ContactEmailsModel.key, miss);
    }, [cache, miss]);
};

export const useContactEmails = (): [result: ContactEmail[] | undefined, loading: boolean, error: any] => {
    const cache = useCache();
    const miss = useGetContactEmails();
    return useCachedModelResult(cache, ContactEmailsModel.key, miss);
};

export default useContactEmails;
