import type { MaybeNull } from '@proton/pass/types';

import type { DeepLinkRoutes } from './types';

export const getDeeplinkURLPrefix = (path: string) => path.substring(0, path.indexOf('/internal'));
export const getDeeplinkFallbackURL = () => '/';

type DeeplinkConfig = {
    [K in keyof DeepLinkRoutes]: (p: {
        get: <T extends keyof DeepLinkRoutes[K]>(key: T) => MaybeNull<DeepLinkRoutes[K][T]>;
    }) => string;
};

export const DEEPLINK_CONFIG: DeeplinkConfig = {
    address_breach: (params) => `/monitor/dark-web/proton/${params.get('AddressID')}`,
    alias_breach: (params) => `/monitor/dark-web/alias/${params.get('ShareID')}:${params.get('ItemID')}`,
    alias_management: () => `/settings#aliases`,
    custom_email_breach: (params) => `/monitor/dark-web/custom/${params.get('CustomEmailID')}`,
    share_members: (params) => `/share/${params.get('ShareID')}`,
    upgrade: getDeeplinkFallbackURL,
    view_item: (params) => `/share/${params.get('ShareID')}/item/${params.get('ItemID')}`,
};
