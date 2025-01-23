import type { MaybeNull } from '@proton/pass/types';

import type { DeepLinkRoutes } from './types';

export const getURLPrefix = (path: string) => path.substring(0, path.indexOf('/internal'));

type DeeplinkConfig = {
    [K in keyof DeepLinkRoutes]: (p: {
        get: <T extends keyof DeepLinkRoutes[K]>(key: T) => MaybeNull<DeepLinkRoutes[K][T]>;
    }) => string;
};

export const DEEPLINK_CONFIG: DeeplinkConfig = {
    address_breach: ({ get }) => `/monitor/dark-web/proton/${get('AddressID')}`,
    alias_breach: ({ get }) => `/monitor/dark-web/alias/${get('ShareID')}:${get('ItemID')}`,
    alias_management: () => `/settings#aliases`,
    custom_email_breach: ({ get }) => `/monitor/dark-web/custom/${get('CustomEmailID')}`,
    share_members: ({ get }) => `/share/${get('ShareID')}`,
    upgrade: () => '' /* should never be called */,
    view_item: ({ get }) => `/share/${get('ShareID')}/item/${get('ItemID')}`,
};

export const fallback = () => '/';
