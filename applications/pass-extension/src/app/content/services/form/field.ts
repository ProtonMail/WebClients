import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { IconController } from 'proton-pass-extension/app/content/injections/icon/controller';
import { createIconController } from 'proton-pass-extension/app/content/injections/icon/controller';
import type { FieldTracker } from 'proton-pass-extension/app/content/services/form/field.tracker';
import { createFieldTracker } from 'proton-pass-extension/app/content/services/form/field.tracker';
import type { FormHandle } from 'proton-pass-extension/app/content/services/form/form';
import type { FormTracker } from 'proton-pass-extension/app/content/services/form/form.tracker';
import { actionTrap, withActionTrap } from 'proton-pass-extension/app/content/utils/action-trap';
import type { AutofillOptions } from 'proton-pass-extension/app/content/utils/autofill';
import { createAutofill } from 'proton-pass-extension/app/content/utils/autofill';
import { getFrameParentVisibility } from 'proton-pass-extension/app/content/utils/frame';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';

import { type FieldType, type FormType, type IdentityFieldType, isVisible } from '@proton/pass/fathom';
import { enableLoginAutofill } from '@proton/pass/lib/settings/utils';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { findBoundingInputElement } from '@proton/pass/utils/dom/input';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import noop from '@proton/utils/noop';

type CreateFieldHandlesOptions = {
    element: HTMLInputElement;
    formType: FormType;
    fieldType: FieldType;
    zIndex: number;
    getFormHandle: () => FormHandle;
};

export type FieldAction = { type: DropdownAction; filterable?: boolean };

export interface FieldHandle {
    /** Random uuid fro cross-frame identification */
    fieldId: string;
    /** action attached for this field */
    action: MaybeNull<FieldAction>;
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
    icon: MaybeNull<IconController>;
    /** optional form section index */
    sectionIndex?: number;
    /** optional identity field sub-type */
    identityType?: IdentityFieldType;
    /** flag indicating event listeners have been registered */
    tracked: boolean;
    tracker: MaybeNull<FieldTracker>;
    /** input value - updated on change */
    value: string;
    /** optimal z-index for icon injection */
    zIndex: number;
    attach: (tracker?: FormTracker) => void;
    attachIcon: () => Maybe<IconController>;
    autofill: (value: string, options?: AutofillOptions) => Promise<void>;
    detach: () => void;
    detachIcon: () => void;
    focus: (options?: { preventAction?: boolean }) => void;
    getBoxElement: (options?: { reflow: boolean }) => HTMLElement;
    getFormHandle: () => FormHandle;
    getVisibility: () => Promise<boolean>;
    setAction: (action: MaybeNull<FieldAction>) => void;
    setValue: (value: string) => void;
    sync: () => void;
}

const canProcessAction = withContext<(action: DropdownAction) => boolean>((ctx, action) => {
    const features = ctx?.getFeatures();
    const settings = ctx?.getSettings();
    const autofillEnabled = settings?.autofill && enableLoginAutofill(settings.autofill);

    switch (action) {
        case DropdownAction.AUTOFILL_LOGIN:
            return Boolean(features?.Autofill && (settings?.autofill.login ?? autofillEnabled));
        case DropdownAction.AUTOFILL_IDENTITY:
            return Boolean(features?.Autofill && (settings?.autofill.identity ?? autofillEnabled));
        case DropdownAction.AUTOSUGGEST_ALIAS:
            return features?.AutosuggestAlias ?? false;
        case DropdownAction.AUTOSUGGEST_PASSWORD:
            return features?.AutosuggestPassword ?? false;
        case DropdownAction.AUTOFILL_CC:
            return true;
    }
});

export const createFieldHandles = ({
    element,
    fieldType,
    zIndex,
    getFormHandle,
}: CreateFieldHandlesOptions): FieldHandle => {
    const field: FieldHandle = {
        fieldId: uniqueId(8),
        fieldType,
        element,
        boxElement: findBoundingInputElement(element),
        icon: null,
        action: null,
        value: element.value,
        autofilled: null,
        tracked: false,
        tracker: null,
        zIndex,
        getFormHandle,
        getBoxElement: (options) => {
            if (options?.reflow) field.boxElement = findBoundingInputElement(element);
            return field.boxElement;
        },
        setValue: (value) => {
            field.autofilled = null;
            return (field.value = value);
        },
        setAction: (action) => {
            if (!action) field.action = null;
            else field.action = canProcessAction(action.type) ? action : null;
        },

        /* if the field is already focused we need to re-dispatch the event on the input
         * element to trigger initial dropdown autofocus. Calling `el.focus()` will not
         * re-dispatch the focus event if it is already the document's active element.
         * In certain cases, we may want to re-focus the element without triggering the
         * attached action effect : as there is no way to attach extra data to a focus event,
         * so we rely on adding custom properties on the field element itself */
        focus(options) {
            const isFocusedField = isActiveElement(field.element);
            if (options?.preventAction) actionTrap(field.element);
            field.element.focus();

            if (isFocusedField) {
                const focusEvent = new FocusEvent('focus', {
                    bubbles: true,
                    cancelable: true,
                    relatedTarget: null,
                });

                return field.element.dispatchEvent(focusEvent);
            }
        },

        autofill: (value, options) =>
            field
                .getVisibility()
                .then(async (visible) => {
                    if (visible) {
                        await withActionTrap(element, createAutofill(element))(value, options);
                        field.autofilled = options?.type ?? field.fieldType;
                    }
                })
                .catch(noop),

        /* if an icon is already attached recycle it */
        attachIcon: withContext((ctx) => {
            if (!ctx) return;

            field.icon =
                field.icon ??
                createIconController({
                    input: field.element,
                    form: field.getFormHandle().element,
                    tag: ctx.elements.control,
                    zIndex: field.zIndex,
                    getAnchor: field.getBoxElement,
                    onClick: () => {
                        if (field.action) {
                            ctx.service.inline.dropdown.open({
                                type: 'field',
                                action: field.action.type,
                                autofocused: false,
                                field,
                            });
                        }
                    },
                });

            field.icon.setStatus(ctx.getState().status);

            return field.icon;
        }),

        getVisibility: withContext(async (ctx) => {
            /** Check if field element is visible (prevents honeypot/hidden field attacks) */
            const visible = ctx && isVisible(element, { opacity: false, skipCache: true });
            if (!visible) return false;

            /** For sub-frames: verify the iframe itself is visible in viewport
             * (prevents hidden iframe injection attacks) */
            if (!ctx.mainFrame) return getFrameParentVisibility();

            return true;
        }),

        detachIcon() {
            field.icon?.detach();
            field.icon = null;
        },

        attach(tracker) {
            if (!field.tracked) {
                field.tracked = true;
                field.tracker = createFieldTracker(field, tracker);
            }
        },

        detach: () => {
            field.tracked = false;
            field.tracker?.detach();
            field.tracker = null;
            field.detachIcon();
        },

        sync: () => {
            /** If settings or feature flags have changed, this field's action may
             * have been invalidated. As such, reset the action and detach icon */
            if (field.action && !canProcessAction(field.action.type)) {
                field.action = null;
                field.detachIcon();
            }
        },
    };

    return field;
};
