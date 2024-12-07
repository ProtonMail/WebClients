import type { DeepLinkRoutes } from './types';

export const getURLPrefix = (path: string) => path.substring(0, path.indexOf('/internal'));

export const deepLinkConfig: Partial<Record<keyof DeepLinkRoutes, (p: URLSearchParams) => string>> = {
    share_members: (p) => `/share/${p.get('ShareId')}`,
    alias_breach: (p) => `/monitor/dark-web/alias/${p.get('ShareId')}/${p.get('ItemId')}/${p.get('Email')}`,
    custom_email_breach: (p) => `/monitor/dark-web/custom/${p.get('CustomEmailID')}`,
    address_breach: (p) => `/monitor/dark-web/proton/${p.get('AddressID')}}`,
    view_item: (p) => `/share/${p.get('ShareId')}/item/${p.get('ItemId')}`,
};

export const fallback = () => '/';
