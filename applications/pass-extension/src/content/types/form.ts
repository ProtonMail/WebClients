import type { MaybeNull } from '@proton/pass/types';

import { DropdownAction } from './dropdown';
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
    USERNAME = 'username',
    PASSWORD = 'password',
    NEW_PASSWORD = 'new-password',
    SUBMIT = 'submit',
}

/* For each form type, specify the form fields
 * we will be dealing with for icon injection,
 * auto-filling | auto-suggesting */
export type FormFieldMap = {
    [FormType.LOGIN]: FormField.USERNAME | FormField.PASSWORD | FormField.SUBMIT;
    [FormType.REGISTER]: FormField.USERNAME | FormField.PASSWORD | FormField.SUBMIT;
};

export type FormFieldTypeMap = {
    [FormField.USERNAME]: HTMLInputElement;
    [FormField.PASSWORD]: HTMLInputElement;
    [FormField.NEW_PASSWORD]: HTMLInputElement;
    [FormField.SUBMIT]: HTMLInputElement | HTMLButtonElement;
};

export type FormFields<T extends FormType> = {
    [Field in FieldsForForm<T>]: FormFieldTypeMap[Field][];
};

export type FieldsForForm<T extends FormType> = FormFieldMap[T];

export interface FormHandle<T extends FormType = FormType> {
    id: string;
    formType: T;
    element: HTMLElement;
    props: { injections: { zIndex: number } };
    fields: { [Field in FieldsForForm<T>]: FieldHandle<T, Field>[] };
    listFields: (predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    tracker?: FormTracker;
    shouldRemove: () => boolean;
    shouldUpdate: () => boolean;
    attach: () => void;
    detach: () => void;
}

export interface FieldHandle<T extends FormType = FormType, U extends FormField = FormField> {
    formType: T;
    fieldType: U;
    element: FormFieldTypeMap[U];
    boxElement: HTMLElement;
    icon: FieldIconHandle | null;
    action: MaybeNull<DropdownAction>;
    value: string;
    getFormHandle: () => FormHandle<T>;
    setValue: (value: string) => void;
    sync: () => void;
    autofill: (value: string) => void;
    attachIcon: (action: DropdownAction) => void;
    detachIcon: () => void;
    attachListeners: (onSubmit: () => void) => void;
    detachListeners: () => void;
}

export interface FormTracker {
    attach: () => void;
    detach: () => void;
}
