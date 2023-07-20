import type { FieldType, FormType } from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types';

import type { AutofillOptions } from '../../shared/form';
import type { DropdownAction } from './dropdown';
import type { FieldIconHandle } from './icon';

export type DetectedForm = { formType: FormType; form: HTMLElement; fields: DetectedField[] };
export type DetectedField = { fieldType: FieldType; field: HTMLInputElement };
export interface FormHandle {
    id: string;
    formType: FormType;
    element: HTMLElement;
    fields: Map<HTMLInputElement, FieldHandle>;
    tracker?: FormTracker;
    detachField: (field: HTMLInputElement) => void;
    getFieldsFor: (type: FieldType, predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    getFields: (predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    reconciliate: (type: FormType, fields: DetectedField[]) => void;
    shouldRemove: () => boolean;
    attach: () => void;
    detach: () => void;
}

export type HTMLElementWithActionTrap = HTMLInputElement & { preventAction?: boolean };
export interface FieldHandle {
    formType: FormType;
    fieldType: FieldType;
    element: HTMLInputElement;
    boxElement: HTMLElement;
    icon: FieldIconHandle | null;
    action: MaybeNull<DropdownAction>;
    value: string;
    tracked: boolean;
    zIndex: number;
    getFormHandle: () => FormHandle;
    getBoxElement: (options?: { revalidate: boolean }) => HTMLElement;
    setValue: (value: string) => void;
    setAction: (action: MaybeNull<DropdownAction>) => void;
    autofill: (value: string, options?: AutofillOptions) => void;
    focus: (options?: { preventAction?: boolean }) => void;
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
    type: FieldType;
    injection: FieldInjectionRule;
    action?: DropdownAction;
};

export interface FormTracker {
    detach: () => void;
    reconciliate: () => void;
}
