import { type Location, createBrowserHistory } from 'history';

import { decodeUtf8Base64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';
import { authStore } from '@proton/pass/lib/auth/store';
import type { ItemFilters, ItemType, MaybeNull, Unpack } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getLocalIDPath, stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS } from '@proton/shared/lib/constants';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';

export type ItemNewRouteParams = { type: ItemType };
export type ItemRouteOptions = { scope?: ItemScope };
export type AuthRouteState = { error?: string; userInitiatedLock?: boolean };
export type ItemScope = Unpack<typeof ItemScopes>;
export type PremiumRoute = Unpack<typeof PremiumRoutes>;

export enum PublicRoutes {
    SecureLink = '/secure-link/:token',
}

/** URL prefixes that define different item scopes.
 * These are prepended to base item routes to create
 * full paths over `:shareId/item/:itemId` */
export const ItemScopes = [
    'share',
    'trash',
    'secure-links',
    'monitor/weak',
    'monitor/duplicates',
    'monitor/2fa',
    'monitor/excluded',
    'shared-with-me',
    'shared-by-me',
] as const;

/** Route segments that should only be accessible
 * to paid users - they should redirect otherwise. */
export const PremiumRoutes = [] as const;

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

/** Resolves the item route given a shareId and an itemId. */
export const getItemRoute = (shareId: string, itemId: string, options?: ItemRouteOptions) => {
    const basePath = `${shareId}/item/${itemId}`;
    const prefixed = subPath(options?.scope ?? 'share', basePath);
    return getLocalPath(prefixed);
};

export const getItemRoutes = () => ItemScopes.map((scope) => getItemRoute(':shareId', ':itemId', { scope }));

export const getItemHistoryRoute = (shareId: string, itemId: string, options?: ItemRouteOptions) =>
    `${getItemRoute(shareId, itemId, options)}/history`;

/** Resolves the new item route given an item type. */
export const getNewItemRoute = (type?: ItemType, scope: ItemScope = 'share'): string => {
    const basePath = `item/new/${type ?? ':type'}`;
    const prefixed = subPath(scope, basePath);
    return getLocalPath(prefixed);
};

export const getTrashRoute = () => getLocalPath('trash');
export const getOnboardingRoute = () => getLocalPath('onboarding');
export const getSecureLinksRoute = () => getLocalPath('secure-links');
export const getMonitorRoute = () => getLocalPath('monitor');

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

export const getBootRedirection = (bootLocation: Location) => {
    const searchParams = new URLSearchParams(bootLocation.search);
    const { search, hash } = bootLocation;
    const pathname = stripLocalBasenameFromPathname(bootLocation.pathname);

    /** Initial filters could be passed on initial boot by
     * a redirection from the proton mail security center */
    if (searchParams.get('filters') !== null) return { pathname, search, hash };

    /** The admin/b2b panels may redirect to a specific share or item */
    const [, shareId, itemId] = bootLocation.pathname.match('share/([^/]+)(/item/([^/]+))?') || [];
    if (shareId || itemId) {
        const filters = partialMerge(getInitialFilters(), { selectedShareId: shareId });
        searchParams.set('filters', encodeFilters(filters));
        return { pathname, search: searchParams.toString(), hash };
    }

    return { pathname, search, hash };
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
    Object.values(PublicRoutes).some((route) => pathMatchesRoute(pathname, route));

/** In Electron, direct `location.href` mutations don't work due
 * to custom URL schemes. We use IPC via the `ContextBridgeApi` to
 * properly reload the page in desktop builds. For non-desktop,
 * standard `window.location.href` assignment is used. */
export const reloadHref = (href: string) => {
    if (DESKTOP_BUILD) void window?.ctxBridge?.navigate(href);
    else window.location.href = href;
};
