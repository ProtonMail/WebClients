export type KasperskyLogin = {
    websiteName?: string;
    websiteURL?: string;
    application?: string;
    accountName?: string;
    loginName?: string;
    login?: string;
    password?: string;
    comment?: string;
};

export enum KasperskyLoginLabel {
    WEBSITE_NAME = 'Website name',
    WEBSITE_URL = 'Website URL',
    APPLICATION = 'Application',
    ACCOUNT_NAME = 'Account name',
    LOGIN_NAME = 'Login name',
    LOGIN = 'Login',
    PASSWORD = 'Password',
    COMMENT = 'Comment',
}

export enum KasperskyNoteLabel {
    NAME = 'Name',
    NOTE = 'Text',
}
