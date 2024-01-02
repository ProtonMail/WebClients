import { createBrowserHistory } from 'history';

import { authStore } from '@proton/pass/lib/auth/store';
import { type ItemType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

export type ItemNewRouteParams = { type: ItemType };

export const history = createBrowserHistory();

/** Joins the current location search parameters to the provided path */
export const preserveSearch = (path: string) => path + location.search;
export const preserveHash = (path: string) => path + location.hash;
export const getCurrentLocation = () => pipe(preserveSearch, preserveHash)(location.pathname);

/** Appends the localID path to the provided path */
export const getLocalPath = (path: string = '') => `/${getLocalIDPath(authStore.getLocalID())}/${path}`;

export const maybeTrash = (path: string, inTrash?: boolean) => `${inTrash ? 'trash/' : ''}${path}`;
export const getTrashRoute = () => getLocalPath('trash');

/** Resolves the item route given a shareId and an itemId. */
export const getItemRoute = (shareId: string, itemId: string, trashed?: boolean) =>
    getLocalPath(maybeTrash(`share/${shareId}/item/${itemId}`, trashed));

/** Resolves the new item route given an item type. */
export const getNewItemRoute = (type: ItemType) => getLocalPath(`item/new/${type}`);
