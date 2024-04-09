import type { ItemType } from '@proton/pass/types';

// Used for both Proton Pass CSV import & Generic CSV import
export type ProtonPassCSVItem = {
    createTime?: string;
    modifyTime?: string;
    name?: string;
    note?: string;
    password?: string;
    totp?: string;
    type?: ItemType;
    url?: string;
    username?: string;
    vault?: string;
};
