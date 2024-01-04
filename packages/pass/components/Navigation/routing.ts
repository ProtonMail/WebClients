import { createBrowserHistory } from 'history';

import { authStore } from '@proton/pass/lib/auth/store';
import type { ItemFilters, ItemType, MaybeNull } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

export type ItemNewRouteParams = { type: ItemType };

export const history = createBrowserHistory();

/** Joins the current location search parameters to the provided path */
export const preserveSearch = (path: string) => path + location.search;
export const preserveHash = (path: string) => path + location.hash;
export const getCurrentLocation = () => pipe(preserveSearch, preserveHash)(location.pathname);

/** Appends the localID path to the provided path. If `localID` is not
 * defined returns the original path (this may be the case in the extension
 * for user's using legacy AuthSessions which were not persisted with the
 * session's LocalID */
export const getLocalPath = (path: string = '') => {
    const localID = authStore.getLocalID();
    return localID ? `/${getLocalIDPath(localID)}/${path}` : `/${path}`;
};

export const maybeTrash = (path: string, inTrash?: boolean) => `${inTrash ? 'trash/' : ''}${path}`;
export const getTrashRoute = () => getLocalPath('trash');

/** Resolves the item route given a shareId and an itemId. */
export const getItemRoute = (shareId: string, itemId: string, trashed?: boolean) =>
    getLocalPath(maybeTrash(`share/${shareId}/item/${itemId}`, trashed));

/** Resolves the new item route given an item type. */
export const getNewItemRoute = (type: ItemType) => getLocalPath(`item/new/${type}`);

const INITIAL_FILTERS: ItemFilters = { search: '', sort: 'recent', type: '*', selectedShareId: null };

export const decodeFilters = (encodedFilters: MaybeNull<string>): ItemFilters =>
    partialMerge(
        INITIAL_FILTERS,
        (() => {
            try {
                if (!encodedFilters) return {};
                return JSON.parse(atob(encodedFilters));
            } catch {
                return {};
            }
        })()
    );

export const decodeFiltersFromSearch = (search: string) => {
    const params = new URLSearchParams(search);
    return decodeFilters(params.get('filters'));
};

export const encodeFilters = (filters: ItemFilters): string => btoa(JSON.stringify(filters));
