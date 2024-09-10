import { type AutofillOptions } from 'proton-pass-extension/app/content/utils/autofill';

import type { FieldType, FormType, IdentityFieldType } from '@proton/pass/fathom';
import type { AutosaveFormEntry, FormCredentials, Maybe, MaybeNull } from '@proton/pass/types';

import type { DropdownAction } from './dropdown';
import type { FieldIconHandle } from './icon';

export type DetectedForm = { formType: FormType; form: HTMLElement; fields: DetectedField[] };
export type DetectedField = { fieldType: FieldType; field: HTMLInputElement };
export interface FormHandle {
    busy: boolean;
    detached: boolean;
    element: HTMLElement;
    fields: Map<HTMLInputElement, FieldHandle>;
    formType: FormType;
    id: string;
    tracker?: FormTracker;
    attach: () => void;
    detach: () => void;
    detachField: (field: HTMLInputElement) => void;
    getFields: (predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    getFieldsFor: (type: FieldType, predicate?: (handle: FieldHandle) => boolean) => FieldHandle[];
    reconciliate: (type: FormType, fields: DetectedField[]) => void;
}

export interface FieldHandle {
    /** action attached for this field */
    action: MaybeNull<DropdownAction>;
    /** Indicates the autofill status of the field. A value of `null`
     * means the current field value was a user input. Otherwise, it
     * stores the FieldType that triggered the autofilled value */
    autofilled: MaybeNull<FieldType>;
    /** bounding element of input field */
    boxElement: HTMLElement;
    /** underlying input element */
    element: HTMLInputElement;
    /** predicted field type */
    fieldType: FieldType;
    /** optional `IconHandle` if attached */
    icon: MaybeNull<FieldIconHandle>;
    /** optional form section index */
    sectionIndex?: number;
    /** optional identity field sub-type */
    identityType?: IdentityFieldType;
    /** flag indicating event listeners have been registered */
    tracked: boolean;
    /** input value - updated on change */
    value: string;
    /** optimal z-index for icon injection */
    zIndex: number;
    attach: (options: { onChange: () => void; onSubmit: () => void }) => void;
    attachIcon: () => Maybe<FieldIconHandle>;
    autofill: (value: string, options?: AutofillOptions) => void;
    detach: () => void;
    detachIcon: () => void;
    focus: (options?: { preventAction?: boolean }) => void;
    getBoxElement: (options?: { reflow: boolean }) => HTMLElement;
    getFormHandle: () => FormHandle;
    setAction: (action: MaybeNull<DropdownAction>) => void;
    setValue: (value: string) => void;
}

export enum FieldInjectionRule {
    ALWAYS /* always inject */,
    FIRST_OF_TYPE /* first field for field type */,
    FIRST_OF_FORM /* first field in form */,
    FIRST_OF_SECTION /* first field in form section */,
    NEVER /* never inject */,
}

export type FormTrackerFieldConfig = {
    type: FieldType;
    injection: FieldInjectionRule;
    action?: DropdownAction;
};

export type FormTrackerState = {
    detached: boolean;
    error: boolean;
    interactionAt?: number;
    processing: boolean;
    submitted: boolean;
    submittedAt?: number;
    timerIdle?: NodeJS.Timeout;
    timerSubmit?: NodeJS.Timeout;
};

export type FormTrackerSyncOptions = {
    data?: FormCredentials;
    partial: boolean;
    reset?: boolean;
    submit: boolean;
};

export interface FormTracker {
    detach: () => void;
    getState: () => FormTrackerState;
    reconciliate: () => void;
    reset: () => void;
    sync: (options: FormTrackerSyncOptions) => Promise<MaybeNull<AutosaveFormEntry>>;
}
