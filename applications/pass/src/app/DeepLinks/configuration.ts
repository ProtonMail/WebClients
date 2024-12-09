import type { DeepLinkRoutes } from './types';

export const getURLPrefix = (path: string) => path.substring(0, path.indexOf('/internal'));

export const deepLinkConfig: Partial<Record<keyof DeepLinkRoutes, (p: URLSearchParams) => string>> = {
    share_members: (p) => `/share/${p.get('ShareID')}`,
    alias_breach: (p) => `/monitor/dark-web/alias/${p.get('ShareID')}/${p.get('ItemID')}/${p.get('Email')}`,
    custom_email_breach: (p) => `/monitor/dark-web/custom/${p.get('CustomEmailID')}`,
    address_breach: (p) => `/monitor/dark-web/proton/${p.get('AddressID')}}`,
    view_item: (p) => `/share/${p.get('ShareID')}/item/${p.get('ItemID')}`,
};

export const fallback = () => '/';
