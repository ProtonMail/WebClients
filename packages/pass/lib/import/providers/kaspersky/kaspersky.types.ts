export type KasperskyItem = Partial<Record<KasperskyItemKey, string>>;

export enum KasperskyItemKey {
    ACCOUNT_NAME = 'Account name',
    APPLICATION = 'Application',
    COMMENT = 'Comment',
    LOGIN = 'Login',
    LOGIN_NAME = 'Login name',
    NAME = 'Name',
    TEXT = 'Text',
    PASSWORD = 'Password',
    WEBSITE_NAME = 'Website name',
    WEBSITE_URL = 'Website URL',
}

export const KasperskyItemKeys = Object.values(KasperskyItemKey) as string[];
