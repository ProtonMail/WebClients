import { FieldType, FormType } from '@proton/pass/fathom';
import browser from '@proton/pass/lib/globals/browser';

import type { FormTrackerFieldConfig } from './types';
import { DropdownAction, FieldInjectionRule } from './types';

export const ACTIVE_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-active.svg');
export const LOCKED_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-locked.svg');
export const DISABLED_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-disabled.svg');
export const COUNTER_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-counter.svg');
export const DROPDOWN_IFRAME_SRC = browser.runtime.getURL('/dropdown.html');
export const NOTIFICATION_IFRAME_SRC = browser.runtime.getURL('/notification.html');

export const FORM_TRACKER_CONFIG: Record<FormType, FormTrackerFieldConfig[]> = {
    [FormType.LOGIN]: [
        {
            type: FieldType.USERNAME,
            injection: FieldInjectionRule.FIRST_OF_FORM,
            action: DropdownAction.AUTOFILL,
        },
        {
            type: FieldType.USERNAME_HIDDEN,
            injection: FieldInjectionRule.NEVER,
        },
        {
            type: FieldType.EMAIL,
            injection: FieldInjectionRule.FIRST_OF_FORM,
            action: DropdownAction.AUTOFILL,
        },
        {
            type: FieldType.PASSWORD_CURRENT,
            injection: FieldInjectionRule.FIRST_OF_FORM,
            action: DropdownAction.AUTOFILL,
        },
    ],
    [FormType.REGISTER]: [
        {
            type: FieldType.USERNAME,
            injection: FieldInjectionRule.NEVER,
        },
        {
            type: FieldType.USERNAME_HIDDEN,
            injection: FieldInjectionRule.NEVER,
        },
        {
            type: FieldType.EMAIL,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOSUGGEST_ALIAS,
        },
        {
            type: FieldType.PASSWORD_NEW,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOSUGGEST_PASSWORD,
        },
    ],
    [FormType.RECOVERY]: [
        {
            type: FieldType.EMAIL,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOFILL,
        },
    ],
    [FormType.PASSWORD_CHANGE]: [
        {
            type: FieldType.PASSWORD_CURRENT,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOFILL,
        },
        {
            type: FieldType.PASSWORD_NEW,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOSUGGEST_PASSWORD,
        },
    ],
    [FormType.MFA]: [],
    /* NOOP forms are forms that were not classified into
     * one of our form types. This can either be a detection
     * error - in that case, if we match any fields of interest
     * we should still add some actions - OR due to exotic
     * forms (newsletters etc..) */
    [FormType.NOOP]: [
        {
            type: FieldType.EMAIL,
            injection: FieldInjectionRule.ALWAYS,
            action: DropdownAction.AUTOSUGGEST_ALIAS,
        },
        {
            type: FieldType.PASSWORD_CURRENT,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOFILL,
        },
        {
            type: FieldType.PASSWORD_NEW,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOSUGGEST_PASSWORD,
        },
    ],
};
