import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';

import type { Maybe, MaybeNull } from '../../types';
import type { ApiOptions, ApiState } from '../../types/api';
import { objectHandler } from '../../utils/object/handler';
import { msToEpoch } from '../../utils/time/epoch';
import { PassErrorCode } from './errors';

export const API_BODYLESS_STATUS_CODES = [101, 204, 205, 304];

export const buildApiState = () =>
    objectHandler<ApiState>({
        appVersionBad: false,
        online: true,
        pendingCount: 0,
        queued: [],
        refreshing: false,
        resumeLocked: false,
        serverTime: undefined,
        sessionInactive: false,
        sessionLocked: false,
        ticksUntilOnline: 0,
        unreachable: false,
    });

export const getSilenced = ({ silence }: ApiOptions = {}, code: string | number): boolean =>
    Array.isArray(silence) ? silence.includes(code) : !!silence;

/** Widens `getIsConnectionIssue` with 429: during an outage the API answers with a
 * mix of 503 and 429, and only the former reads as a connection issue. Without this
 * a rate limited response looks like a legitimate failure, so the offline unlock
 * screen is skipped and the user lands on an error state. */
export const getIsApiUnavailable = (err: unknown) =>
    getIsConnectionIssue(err) || (err as { status?: number })?.status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS;

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

/** Routes required to bridge the offline-booted state back to a fully
 * authenticated online session. Anything outside this list is a UI-driven
 * side-effect that must not fire when offline-booted & session is unresumed. */
export const SESSION_RESUME_ROUTES = [
    'tests/ping', // connectivity check route
    'pass/v1/user/session/lock', // post-resume login (checkSessionLock/forceLock)
    'core/v4/users', // resumeSession (getUser)
    'core/v4/auth', // core auth routes
    'auth/', // auth routes
];

export const isSessionResumeRoute = (url?: string): boolean =>
    !!url && SESSION_RESUME_ROUTES.some((route) => url.startsWith(route));
