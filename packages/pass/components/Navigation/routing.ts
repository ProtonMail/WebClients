import { type Location, createBrowserHistory } from 'history';

import { decodeUtf8Base64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';
import { authStore } from '@proton/pass/lib/auth/store';
import type { ItemFilters, ItemType, MaybeNull } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getLocalIDPath, stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS } from '@proton/shared/lib/constants';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';

export type ItemNewRouteParams = { type: ItemType };
export type ItemRouteOptions = { trashed?: boolean; prefix?: string };
export type AuthRouteState = { error?: string; userInitiatedLock?: boolean };

export enum UnauthorizedRoutes {
    SecureLink = '/secure-link/:token',
}

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
    const re = /\/u\/\d+(?:\/(.+))?\/?$/;
    if (!re.test(path)) return path;

    const match = path.match(re);
    return match?.[1] ?? '';
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

export const getInitialFilters = (): ItemFilters => ({ search: '', sort: 'recent', type: '*', selectedShareId: null });

export const decodeFilters = (encodedFilters: MaybeNull<string>): ItemFilters =>
    partialMerge(
        getInitialFilters(),
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

export const getPassWebUrl = (apiUrl: string, subPath: string = '') => {
    const appUrl = getAppUrlFromApiUrl(apiUrl, APPS.PROTONPASS);
    return appUrl.toString() + subPath;
};

export const getRouteError = (search: string) => new URLSearchParams(search).get('error');

export const getBootRedirectPath = (bootLocation: Location) => {
    const searchParams = new URLSearchParams(bootLocation.search);

    const redirectPath = (() => {
        if (searchParams.get('filters') !== null) {
            return bootLocation.pathname;
        }

        const [, shareId, itemId] = bootLocation.pathname.match('share/([^/]+)(/item/([^/]+))?') || [];
        if (shareId || itemId) {
            const filters = partialMerge(getInitialFilters(), { selectedShareId: shareId });
            searchParams.set('filters', encodeFilters(filters));
            return `${bootLocation.pathname}?${searchParams.toString()}`;
        }

        return bootLocation.pathname;
    })();

    return stripLocalBasenameFromPathname(redirectPath);
};
const extractPathWithoutFragment = (path: string): string => {
    const indexOfHash = path.indexOf('#');
    return indexOfHash === -1 ? path : path.substring(0, indexOfHash);
};

const pathMatchesRoute = (path: string, routeTemplate: string): boolean => {
    const cleanedPath = extractPathWithoutFragment(path);
    const templateParts = routeTemplate.split('/');
    const pathParts = cleanedPath.split('/');

    return (
        templateParts.length === pathParts.length &&
        templateParts.every((part, i) => part.startsWith(':') || part === pathParts[i])
    );
};

export const isUnauthorizedPath = ({ pathname }: Location): boolean =>
    Object.values(UnauthorizedRoutes).some((route) => pathMatchesRoute(pathname, route));
