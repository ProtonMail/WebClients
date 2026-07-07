import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const getSidebarUpsellStorageKey = (upsellId: string): string => {
    return `lumo-sidebar-upsell-${upsellId}`;
};

export const isSidebarUpsellDismissed = (upsellId: string): boolean => {
    const stored = readScopedLocalStorageJson<unknown>(getSidebarUpsellStorageKey(upsellId), false);

    return stored === true;
};

export const persistSidebarUpsellDismissed = (upsellId: string): void => {
    writeScopedLocalStorageJson(getSidebarUpsellStorageKey(upsellId), true);
};
