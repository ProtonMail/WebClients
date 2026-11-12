export enum MSecureFieldType {
    TEXT = 0,
    WEBSITE = 2,
    USERNAME = 7,
    PASSWORD = 8,
    SECRET = 9,
    DATE = 11,
    CARD_NUMBER = 12,
}

export type MSecureField = { label: string; type: number; value: string };

export type MSecureItem = {
    name: string;
    template: string;
    tag: string;
    note: string;
    fields: MSecureField[];
};
