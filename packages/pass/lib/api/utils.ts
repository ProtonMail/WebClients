import type { ApiOptions, MaybeNull } from '@proton/pass/types';

import { PassErrorCode } from './errors';

export const API_BODYLESS_STATUS_CODES = [101, 204, 205, 304];

export const getSilenced = ({ silence }: ApiOptions = {}, code: string | number): boolean =>
    Array.isArray(silence) ? silence.includes(code) : !!silence;

export const isAccessRestricted = (code: number, url?: string) =>
    (code === PassErrorCode.MISSING_ORG_2FA || code === PassErrorCode.NOT_ALLOWED) &&
    url?.includes('pass/v1/user/access');

type PageIteratorConfig<T> = {
    request: (cursor?: string) => Promise<{ data: T[]; cursor?: MaybeNull<string> }>;
    onBatch?: (count: number) => void;
};

export const createPageIterator = <T>(options: PageIteratorConfig<T>) => {
    const iterator = async (cursor?: string, count: number = 0): Promise<T[]> => {
        const result = await options.request(cursor);
        const nextCount = count + result.data.length;
        options.onBatch?.(nextCount);

        return result.cursor ? result.data.concat(await iterator(result.cursor, nextCount)) : result.data;
    };

    return iterator;
};
