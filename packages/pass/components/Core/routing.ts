import { authentication } from '@proton/pass/lib/auth/store';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

/** Joins the current location search parameters to the provided path */
export const preserveSearch = (path: string) => path + location.search;

/** Appends the localID path to the provided path */
export const getLocalPath = (path: string = '') => `/${getLocalIDPath(authentication.getLocalID())}/${path}`;

export const maybeTrash = (path: string, inTrash?: boolean) => `${inTrash ? 'trash/' : ''}${path}`;
export const getTrashRoute = () => getLocalPath('trash');

/** Resolves the item route given a shareId and an itemId. */
export const getItemRoute = (shareId: string, itemId: string, trashed?: boolean) =>
    getLocalPath(maybeTrash(`share/${shareId}/item/${itemId}`, trashed));
