import { getCanonicalAddresses } from '@proton/shared/lib/api/addresses';
import { API_CODES } from '@proton/shared/lib/constants';
import { GetCanonicalEmailsMap } from '@proton/shared/lib/interfaces/hooks/GetCanonicalEmailsMap';
import { GetCanonicalAddressesApiResponse } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { useCallback } from 'react';
import useApi from './useApi';
import useCache from './useCache';
import { getIsRecordInvalid, getPromiseValue } from './useCachedModelResult';

const CACHE_KEY = 'CANONICAL_EMAILS';

export const useGetCanonicalEmailsMap = () => {
    const api = useApi();
    const cache = useCache();

    const getCanonicalEmailsMap = useCallback(
        async (emails: string[]) => {
            if (!emails.length) {
                return Promise.resolve({});
            }
            const encodedEmails = emails.map((email) => encodeURIComponent(email));
            const { Responses, Code } = await api<GetCanonicalAddressesApiResponse>(
                getCanonicalAddresses(encodedEmails)
            );
            if (Code !== API_CODES.GLOBAL_SUCCESS) {
                throw new Error('Canonize operation failed');
            }
            return Responses.reduce<SimpleMap<string>>((acc, { Email, Response: { Code, CanonicalEmail } }) => {
                if (Code !== API_CODES.SINGLE_SUCCESS) {
                    throw new Error('Canonize operation failed');
                }
                acc[Email] = CanonicalEmail;
                return acc;
            }, {});
        },
        [api, cache]
    );

    return useCallback<GetCanonicalEmailsMap>(
        (emails: string[]) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            const missing = emails.filter((email) => {
                return getIsRecordInvalid(subCache.get(email));
            });
            const promise = getCanonicalEmailsMap(missing);
            const miss = async (tzid: string) => {
                const map = await promise;
                return map[tzid];
            };
            return Promise.all(
                emails.map(async (email) => {
                    const result = await getPromiseValue(subCache, email, miss);
                    return {
                        email,
                        result: result as string,
                    };
                })
            ).then((result) => {
                return result.reduce<SimpleMap<string>>((acc, { email, result }) => {
                    acc[email] = result;
                    return acc;
                }, {});
            });
        },
        [cache, getCanonicalEmailsMap]
    );
};
