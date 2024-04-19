import { createBrowserHistory } from 'history';

import { decodeUtf8Base64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';
import { authStore } from '@proton/pass/lib/auth/store';
import type { ItemFilters, ItemType, MaybeNull } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

export type ItemNewRouteParams = { type: ItemType };
export type ItemRouteOptions = { trashed?: boolean; prefix?: string };

export const history = createBrowserHistory();

/** Appends the localID path to the provided path. If `localID` is not
 * defined returns the original path (this may be the case in the extension
 * for user's using legacy AuthSessions which were not persisted with the
 * session's LocalID */
export const getLocalPath = (path: string = '') => {
    const localID = authStore.getLocalID();
    return localID !== undefined ? `/${getLocalIDPath(localID)}/${path}` : `/${path}`;
};

export const removeLocalPath = (path: string) => {
    const re = /\/u\/\d+\/(.+)/;
    const match = path.match(re);
    return match?.[1] ?? path;
};

export const subPath = (path: string, sub: string) => `${path}/${sub}`;
export const maybeTrash = (path: string, inTrash?: boolean) => (inTrash ? subPath('trash', path) : path);

/** Resolves the item route given a shareId and an itemId. */
export const getItemRoute = (shareId: string, itemId: string, options?: ItemRouteOptions) => {
    const basePath = maybeTrash(`share/${shareId}/item/${itemId}`, options?.trashed);
    const prefixed = options?.prefix ? subPath(options.prefix, basePath) : basePath;
    return getLocalPath(prefixed);
};

export const getItemHistoryRoute = (shareId: string, itemId: string, options?: ItemRouteOptions) =>
    `${getItemRoute(shareId, itemId, options)}/history`;

/** Resolves the new item route given an item type. */
export const getNewItemRoute = (type: ItemType) => getLocalPath(`item/new/${type}`);
export const getTrashRoute = () => getLocalPath('trash');
export const getOnboardingRoute = () => getLocalPath('onboarding');

const INITIAL_FILTERS: ItemFilters = { search: '', sort: 'recent', type: '*', selectedShareId: null };

export const decodeFilters = (encodedFilters: MaybeNull<string>): ItemFilters =>
    partialMerge(
        INITIAL_FILTERS,
        (() => {
            try {
                if (!encodedFilters) return {};
                return JSON.parse(decodeUtf8Base64(encodedFilters));
            } catch {
                return {};
            }
        })()
    );

export const decodeFiltersFromSearch = (search: string) => {
    const params = new URLSearchParams(search);
    return decodeFilters(params.get('filters'));
};

export const encodeFilters = (filters: ItemFilters): string => encodeUtf8Base64(JSON.stringify(filters));
