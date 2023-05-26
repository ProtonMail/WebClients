import type { MaybeNull } from '@proton/pass/types';

import type { DropdownAction } from './dropdown';
import type { FieldIconHandle } from './icon';

/* Form types based on protonpass-fathom
 * predicted form types */
export enum FormType {
    LOGIN = 'login',
    REGISTER = 'register',
}

/* Form field types based on protonpass-fathom
 * predicted form field */
export enum FormField {
    EMAIL = 'email',
    USERNAME = 'username',
    USERNAME_HIDDEN = 'username-hidden',
    PASSWORD_CURRENT = 'password',
    PASSWORD_NEW = 'new-password',
}

export type FormFields = { [Field in FormField]?: HTMLInputElement[] };

export interface FormHandle {
    id: string;
    formType: FormType;
    element: HTMLElement;
    props: { injections: { zIndex: number } };
    fields: { [Field in FormField]?: FieldHandle[] };
    getFieldsFor: (type: FormField, predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    listFields: (predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    tracker?: FormTracker;
    shouldRemove: () => boolean;
    shouldUpdate: () => boolean;
    attach: () => void;
    detach: () => void;
}

export interface FieldHandle {
    formType: FormType;
    fieldType: FormField;
    element: HTMLInputElement;
    boxElement: HTMLElement;
    icon: FieldIconHandle | null;
    action: MaybeNull<DropdownAction>;
    value: string;
    getFormHandle: () => FormHandle;
    setValue: (value: string) => void;
    setAction: (action: MaybeNull<DropdownAction>) => void;
    autofill: (value: string) => void;
    attachIcon: () => FieldIconHandle;
    detachIcon: () => void;
    attachListeners: (onSubmit: () => void) => void;
    detachListeners: () => void;
}

export enum FieldInjectionRule {
    ALWAYS /* always inject */,
    FIRST_OF_TYPE /* first field for field type */,
    FIRST_OF_FORM /* first field in form */,
    NEVER /* never inject */,
}

export type FormTrackerFieldConfig = {
    type: FormField;
    injection: FieldInjectionRule;
    action?: DropdownAction;
};

export interface FormTracker {
    attach: () => void;
    detach: () => void;
    autofocus: () => void;
}
