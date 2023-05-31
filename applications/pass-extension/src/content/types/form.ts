import type { FormField, FormType, MaybeNull } from '@proton/pass/types';

import type { DropdownAction } from './dropdown';
import type { FieldIconHandle } from './icon';

export type DetectedField = { fieldType: FormField; field: HTMLInputElement };
export type FormFields = DetectedField[];

export interface FormHandle {
    id: string;
    formType: FormType;
    element: HTMLElement;
    props: { injections: { zIndex: number } };
    fields: Map<HTMLInputElement, FieldHandle>;
    tracker?: FormTracker;
    detachField: (field: HTMLInputElement) => void;
    getFieldsFor: (type: FormField, predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    getFields: (predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    reconciliate: (fields: DetectedField[]) => void;
    shouldRemove: () => boolean;
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
    tracked: boolean;
    zIndex: number;
    getFormHandle: () => MaybeNull<FormHandle>;
    getBoxElement: () => HTMLElement;
    setValue: (value: string) => void;
    setAction: (action: MaybeNull<DropdownAction>) => void;
    autofill: (value: string) => HTMLInputElement;
    focus: (options?: { preventDefault?: boolean }) => void;
    attachIcon: () => FieldIconHandle;
    detachIcon: () => void;
    attach: (onSubmit: () => void) => void;
    detach: () => void;
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
    detach: () => void;
    reconciliate: () => void;
}
