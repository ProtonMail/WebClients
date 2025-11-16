import { FieldType, FormType } from '@proton/pass/fathom/labels';
import browser from '@proton/pass/lib/globals/browser';

export const ACTIVE_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-active.svg');
export const LOCKED_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-locked.svg');
export const DISABLED_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-disabled.svg');
export const COUNTER_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-counter.svg');
export const DROPDOWN_IFRAME_SRC = browser.runtime.getURL('/dropdown.html');
export const NOTIFICATION_IFRAME_SRC = browser.runtime.getURL('/notification.html');

export enum NotificationAction {
    AUTOSAVE = 'AUTOSAVE',
    OTP = 'OTP',
    PASSKEY_CREATE = 'PASSKEY::CREATE',
    PASSKEY_GET = 'PASSKEY::GET',
}

export enum DropdownAction {
    AUTOFILL_CC = 'AUTOFILL_CC',
    AUTOFILL_IDENTITY = 'AUTOFILL_IDENTITY',
    AUTOFILL_LOGIN = 'AUTOFILL_LOGIN',
    AUTOSUGGEST_ALIAS = 'AUTOSUGGEST_ALIAS',
    AUTOSUGGEST_PASSWORD = 'AUTOSUGGEST_PASSWORD',
}

type FieldConfig = {
    filterable?: boolean;
    action?: DropdownAction;
};

export const FORM_TRACKER_CONFIG: Record<FormType, Partial<Record<FieldType, FieldConfig>>> = {
    [FormType.LOGIN]: {
        [FieldType.USERNAME]: { action: DropdownAction.AUTOFILL_LOGIN, filterable: true },
        [FieldType.USERNAME_HIDDEN]: {},
        [FieldType.EMAIL]: { action: DropdownAction.AUTOFILL_LOGIN, filterable: true },
        [FieldType.PASSWORD_CURRENT]: { action: DropdownAction.AUTOFILL_LOGIN },
        [FieldType.CREDIT_CARD]: { action: DropdownAction.AUTOFILL_CC },
    },
    [FormType.REGISTER]: {
        [FieldType.USERNAME]: {},
        [FieldType.USERNAME_HIDDEN]: {},
        [FieldType.EMAIL]: { action: DropdownAction.AUTOSUGGEST_ALIAS },
        [FieldType.PASSWORD_NEW]: { action: DropdownAction.AUTOSUGGEST_PASSWORD },
        [FieldType.IDENTITY]: { action: DropdownAction.AUTOFILL_IDENTITY },
        [FieldType.CREDIT_CARD]: { action: DropdownAction.AUTOFILL_CC },
    },
    [FormType.RECOVERY]: {
        [FieldType.EMAIL]: { action: DropdownAction.AUTOFILL_LOGIN, filterable: true },
        [FieldType.IDENTITY]: { action: DropdownAction.AUTOFILL_IDENTITY },
        [FieldType.CREDIT_CARD]: { action: DropdownAction.AUTOFILL_CC },
    },
    [FormType.PASSWORD_CHANGE]: {
        [FieldType.PASSWORD_CURRENT]: { action: DropdownAction.AUTOFILL_LOGIN },
        [FieldType.PASSWORD_NEW]: { action: DropdownAction.AUTOSUGGEST_PASSWORD },
    },
    /* NOOP forms are forms that were not classified into
     * one of our form types. This can either be a detection
     * error - in that case, if we match any fields of interest
     * we should still add some actions - OR due to exotic
     * forms (newsletters etc..) */
    [FormType.NOOP]: {
        [FieldType.EMAIL]: { action: DropdownAction.AUTOSUGGEST_ALIAS },
        [FieldType.PASSWORD_CURRENT]: { action: DropdownAction.AUTOFILL_LOGIN },
        [FieldType.PASSWORD_NEW]: { action: DropdownAction.AUTOSUGGEST_PASSWORD },
        [FieldType.IDENTITY]: { action: DropdownAction.AUTOFILL_IDENTITY },
        [FieldType.CREDIT_CARD]: { action: DropdownAction.AUTOFILL_CC },
    },
};
