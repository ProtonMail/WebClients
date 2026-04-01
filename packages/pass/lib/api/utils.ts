import { authStore } from '@proton/pass/lib/auth/store';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import type { ApiAuth, ApiOptions, ApiState } from '@proton/pass/types/api';
import { AuthMode } from '@proton/pass/types/api';
import { objectHandler } from '@proton/pass/utils/object/handler';
import { msToEpoch } from '@proton/pass/utils/time/epoch';

import { PassErrorCode } from './errors';

export const API_BODYLESS_STATUS_CODES = [101, 204, 205, 304];

/** Provides dynamic API auth options based on the current session state.
 * Supports upgrading from token-based to cookie-based authentication.
 * This is crucial for scenarios where token-based auth is required
 * before transitioning to cookies, enabling seamless auth upgrades. */
export const getDynamicAuth = (): Maybe<ApiAuth> => {
    const { cookies, UID, AccessToken, RefreshToken, RefreshTime } = authStore.getSession();
    if (!UID) return undefined;

    if (cookies) return { type: AuthMode.COOKIE, UID, RefreshTime };
    if (AccessToken && RefreshToken) return { type: AuthMode.TOKEN, UID, AccessToken, RefreshToken, RefreshTime };
};

export const buildApiState = () =>
    objectHandler<ApiState>({
        appVersionBad: false,
        online: true,
        pendingConnectivityChange: 0,
        pendingCount: 0,
        queued: [],
        refreshing: false,
        serverTime: undefined,
        sessionInactive: false,
        sessionLocked: false,
        unreachable: false,
    });

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

/** Don't fetch if resource has not been modified since our last fetch.
 * `lastRequestedAt` should be an Unix epoch (seconds) */
export const fetchIfModified = async (url: string, lastRequestedAt: number): Promise<Maybe<Response>> => {
    if (lastRequestedAt !== 0) {
        const header = (await fetch(url, { method: 'HEAD' })).headers.get('Last-Modified');
        const lastModified = header ? msToEpoch(new Date(header).getTime()) : 0;
        if (lastRequestedAt >= lastModified) return;
    }

    return fetch(url);
};
