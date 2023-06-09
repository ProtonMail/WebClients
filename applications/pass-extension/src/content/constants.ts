import browser from '@proton/pass/globals/browser';
import { FormField, FormType } from '@proton/pass/types';

import type { FormTrackerFieldConfig } from './types';
import { DropdownAction, FieldInjectionRule } from './types';

export const EXTENSION_PREFIX = 'protonpass';
export const CONTENT_SCRIPT_INJECTED_MESSAGE = `${EXTENSION_PREFIX}-cs-injected`;
export const INPUT_STYLES_ATTR = `data-${EXTENSION_PREFIX}-styles-reset`;
export const PROCESSED_FIELD_ATTR = `data-${EXTENSION_PREFIX}-field`;
export const PROCESSED_FORM_ATTR = `data-${EXTENSION_PREFIX}-form`;
export const ICON_ROOT_CLASSNAME = `${EXTENSION_PREFIX}-input`;
export const ICON_WRAPPER_CLASSNAME = `${ICON_ROOT_CLASSNAME}--wrapper`;
export const ICON_CLASSNAME = `${ICON_ROOT_CLASSNAME}--icon`;
export const ICON_SVG = `${ICON_ROOT_CLASSNAME}--svg`;

export const ICON_PADDING = 5;
export const ICON_MAX_HEIGHT = 25;
export const ICON_MIN_HEIGHT = 18;
export const DROPDOWN_WIDTH = 250;
export const MIN_DROPDOWN_HEIGHT = 60;
export const NOTIFICATION_HEIGHT = 335;
export const NOTIFICATION_WIDTH = 320;

export const ACTIVE_ICON_SRC = browser.runtime.getURL('/assets/protonpass-icon.svg');
export const DROPDOWN_IFRAME_SRC = browser.runtime.getURL('/dropdown.html');
export const NOTIFICATION_IFRAME_SRC = browser.runtime.getURL('/notification.html');

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
            type: FormField.USERNAME,
            injection: FieldInjectionRule.FIRST_OF_FORM,
            action: DropdownAction.AUTOFILL,
        },
        {
            type: FormField.USERNAME_HIDDEN,
            injection: FieldInjectionRule.NEVER,
        },
        {
            type: FormField.EMAIL,
            injection: FieldInjectionRule.FIRST_OF_FORM,
            action: DropdownAction.AUTOFILL,
        },
        {
            type: FormField.PASSWORD_CURRENT,
            injection: FieldInjectionRule.FIRST_OF_FORM,
            action: DropdownAction.AUTOFILL,
        },
    ],
    [FormType.REGISTER]: [
        {
            type: FormField.USERNAME,
            injection: FieldInjectionRule.NEVER,
        },
        {
            type: FormField.USERNAME_HIDDEN,
            injection: FieldInjectionRule.NEVER,
        },
        {
            type: FormField.EMAIL,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOSUGGEST_ALIAS,
        },
        {
            type: FormField.PASSWORD_NEW,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOSUGGEST_PASSWORD,
        },
    ],
    [FormType.RECOVERY]: [
        {
            type: FormField.EMAIL,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOFILL,
        },
    ],
    [FormType.PASSWORD_CHANGE]: [
        {
            type: FormField.PASSWORD_CURRENT,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOFILL,
        },
        {
            type: FormField.PASSWORD_NEW,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOSUGGEST_PASSWORD,
        },
    ],
    [FormType.MFA]: [] /* TODO */,
    /* NOOP forms are forms that were not classified into
     * on of our form types. This can either be a detection
     * error - in that case, if we match any fields of interest
     * we should still add some actions - OR due to exotic
     * forms (newsletters etc..) */
    [FormType.NOOP]: [
        {
            type: FormField.EMAIL,
            injection: FieldInjectionRule.ALWAYS,
            action: DropdownAction.AUTOSUGGEST_ALIAS,
        },
        {
            type: FormField.PASSWORD_CURRENT,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOFILL,
        },
        {
            type: FormField.PASSWORD_NEW,
            injection: FieldInjectionRule.FIRST_OF_TYPE,
            action: DropdownAction.AUTOSUGGEST_PASSWORD,
        },
    ],
};
