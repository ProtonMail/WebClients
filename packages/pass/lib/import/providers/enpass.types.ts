export type EnpassData = {
    folders: EnpassFolder[];
    items: EnpassItem<EnpassCategory>[];
};

export type EnpassFolder = {
    icon: string;
    parent_uuid: string;
    title: string;
    updated_at: number;
    uuid: string;
};

export type EnpassItem<T extends EnpassCategory> = {
    [K in EnpassCategory]: {
        category: K;
        archived: number;
        auto_submit: number;
        createdAt: number;
        favorite: number;
        icon: EnpassItemIcon;
        note: string;
        subtitle: string;
        template_type: string;
        title: string;
        trashed: number;
        updated_at: number;
        uuid: string;
        folders?: string[];
    } & (K extends EnpassCategory.NOTE ? {} : { fields?: EnpassField[] });
}[T];

export enum EnpassCategory {
    LOGIN = 'login',
    CREDIT_CARD = 'creditcard',
    NOTE = 'note',
    PASSWORD = 'password',

    // Unsupported
    IDENTITY = 'identity',
    FINANCE = 'finance',
    LICENSE = 'license',
    TRAVEL = 'travel',
    COMPUTER = 'computer',
    MISC = 'misc',
}

export type EnpassField = {
    deleted: number;
    history?: EnpassFieldHistory[];
    label: string;
    order: number;
    sensitive: number;
    type: string;
    uid: number;
    updated_at: number;
    value: string;
    value_updated_at: number;
};

export type EnpassFieldHistory = {
    encrypted: boolean;
    updated_at: number;
    value: string;
};

export type EnpassItemIcon = {
    fav: string;
    image: {
        file: string;
    };
    type: number;
    uuid: string;
};
