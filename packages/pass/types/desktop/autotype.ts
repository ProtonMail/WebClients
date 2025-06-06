export type AutotypeProperties = { fields: string[]; enterAtTheEnd?: boolean };

export type AutotypeConfirmFromShortcutProps = {
    autotypeProps: AutotypeProperties;
    onConfirm?: () => void;
};

export enum AutotypeKey {
    USERNAME_TAB_PASSWORD_ENTER = 'autotype-username-tab-password-enter',
    USERNAME_TAB_PASSWORD = 'autotype-username-tab-password',
    EMAIL_TAB_PASSWORD_ENTER = 'autotype-email-tab-password-enter',
    EMAIL_TAB_PASSWORD = 'autotype-email-tab-password',
    USERNAME_ENTER = 'autotype-username-enter',
    EMAIL_ENTER = 'autotype-email-enter',
    PASSWORD_ENTER = 'autotype-password-enter',
}

export type AutotypeAction = {
    getAutotypeProps: () => AutotypeProperties;
    key: AutotypeKey;
};
