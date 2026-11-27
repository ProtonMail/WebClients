import { removeItem } from '@proton/shared/lib/helpers/storage';

export const getFolderUidStorageKey = (namespace: string) => `${namespace}.meetBackgroundsFolderUid`;

export const forgetBackgroundsFolderUid = (namespace: string) => {
    removeItem(getFolderUidStorageKey(namespace));
};
