import { FieldType, FormType } from '@proton/pass/fathom';
import browser from '@proton/pass/globals/browser';

import type { FormTrackerFieldConfig } from './types';
import { DropdownAction, FieldInjectionRule } from './types';

export const INPUT_BASE_STYLES_ATTR = `data-protonpass-base-css`;

export const ICON_MAX_HEIGHT = 28;
export const ICON_MIN_HEIGHT = 16;
export const ICON_PADDING = 8;
export const DROPDOWN_WIDTH = 250;
export const MIN_DROPDOWN_HEIGHT = 60;
export const NOTIFICATION_HEIGHT = 335;
export const NOTIFICATION_HEIGHT_SM = 220;
export const NOTIFICATION_WIDTH = 320;

export const ACTIVE_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-active.svg');
export const LOCKED_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-locked.svg');
export const DISABLED_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-disabled.svg');
export const COUNTER_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon-counter.svg');
export const DROPDOWN_IFRAME_SRC = browser.runtime.getURL('/dropdown.html');
export const NOTIFICATION_IFRAME_SRC = browser.runtime.getURL('/notification.html');

/* heuristic max detection time duration in ms for sanity checking */
export const MIN_MAX_DETECTION_TIME = 250;
export const MAX_MAX_DETECTION_TIME = 1_000;

/* ⚠️ WIP ⚠️
 * This list should be actively maintained
 * to list all top-level domains of email
 * providers. On sign-up forms for these
 * domains, we want to avoid prompting the
 * user for an alias creation on the email
 * field (if any). In some cases  we might
 * still permit it - ie in the case of google.com,
 * you can actually sign up with an email */
export const EMAIL_PROVIDERS = [
    'proton.me',
    'protonmail.com',
    'protonvpn.com',
    'proton.black',
    'proton.pink',
    'proton.local',
];

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
