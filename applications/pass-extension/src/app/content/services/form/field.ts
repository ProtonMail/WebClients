import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { AutofillOptions } from 'proton-pass-extension/app/content/services/autofill/autofill.utils';
import { createAutofill } from 'proton-pass-extension/app/content/services/autofill/autofill.utils';
import type { InteractivityController } from 'proton-pass-extension/app/content/services/form/field.interactivity';
import { createInteractivityController } from 'proton-pass-extension/app/content/services/form/field.interactivity';
import type { IconController } from 'proton-pass-extension/app/content/services/inline/icon/icon.controller';
import { getFrameID, getFrameParentVisibility } from 'proton-pass-extension/app/content/utils/frame';
import type { AbstractField } from 'proton-pass-extension/types/field';
import type { FrameField } from 'proton-pass-extension/types/frames';

import { isVisible } from '@proton/pass/fathom';
import type { FieldType, FormType } from '@proton/pass/fathom/labels';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { isActiveElement } from '@proton/pass/utils/dom/active-element';
import { isInputElement } from '@proton/pass/utils/dom/predicates';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { DOM_SETTLE_MS, nextTick, onNextTick } from '@proton/pass/utils/time/next-tick';
import noop from '@proton/utils/noop';

import { type FieldAnchor, createFieldAnchor } from './field.anchor';
import type { FieldTracker } from './field.tracker';
import { createFieldTracker } from './field.tracker';
import { createElementTrap, validateAction } from './field.utils';
import type { FormHandle } from './form';
import type { FormTracker } from './form.tracker';

type CreateFieldHandlesOptions = {
    element: HTMLInputElement;
    formId: string;
    formType: FormType;
    fieldType: FieldType;
    getFormHandle: () => FormHandle;
};

export type FieldAction = { type: DropdownAction; filterable?: boolean };
export type FieldElement = HTMLInputElement | HTMLSelectElement;

interface FieldHandleBase extends FrameField {
    /** action attached for this field */
    action: MaybeNull<FieldAction>;
    actionPrevented: boolean;
    /** Indicates the autofill status of the field. A value of `null`
     * means the current field value was user generated. Otherwise, it
     * stores the FieldType that triggered the autofilled value */
    autofilled: MaybeNull<FieldType>;
    /** Autofilled item key */
    autofilledItemKey: MaybeNull<string>;
    /** underlying input element */
    element: FieldElement;
    /** optional `IconHandle` if attached */
    icon: MaybeNull<IconController>;
    /** InteractivityController exposed for autofill sequences */
    interactivity: InteractivityController;
    /** optional form section index */
    sectionIndex?: number;
    /** flag indicating event listeners have been registered */
    tracked: boolean;
    /** Attached field tracker instance */
    tracker: MaybeNull<FieldTracker>;
    /** input value - updated on change */
    value: string;
    attach: (tracker?: FormTracker) => void;
    autofill: (value: string, options?: AutofillOptions) => Promise<void>;
    detach: () => void;
    focus: (options?: { preventAction?: boolean }) => void;
    getAnchor: (options?: { reflow: boolean }) => FieldAnchor;
    getFormHandle: () => FormHandle;
    getVisibility: () => Promise<boolean>;
    isActive: () => Promise<boolean>;
    matches: (field?: FrameField) => boolean;
    preventAction: (duration?: number) => () => void;
    setAction: (action: MaybeNull<FieldAction>) => void;
    setIcon: (icon: MaybeNull<IconController>) => void;
    setValue: (value: string) => void;
    sync: () => void;
}

export type FieldHandle<T extends FieldType = FieldType> = Extract<
    { [K in FieldType]: FieldHandleBase & AbstractField<K> }[FieldType],
    { fieldType: T }
>;

export const createFieldHandles = ({
    element,
    fieldType,
    formId,
    getFormHandle,
}: CreateFieldHandlesOptions): FieldHandle => {
    let anchor: MaybeNull<FieldAnchor> = null;
    const actionTrap = createElementTrap(element, 'actionPrevented');
    const interactivity = createInteractivityController(element);

    const field: FieldHandle = {
        fieldId: uniqueId(8),
        formId,
        frameId: getFrameID(),
        fieldType,
        element,
        icon: null,
        action: null,
        value: element.value,
        autofilled: null,
        autofilledItemKey: null,
        tracked: false,
        tracker: null,
        interactivity,

        get actionPrevented() {
            return (
                actionTrap.isTrapped() ||
                withContext<() => boolean>((ctx) => ctx?.service.autofill.processing ?? false)()
            );
        },

        getFormHandle,

        getAnchor: (options) => {
            if (!anchor) anchor = createFieldAnchor(element);
            else if (options?.reflow) anchor.revalidate();
            return anchor;
        },

        setValue: withContext((ctx, value) => {
            /** NOTE: when `setValue` is triggered as a side-effect of an
             * autofill request (via the `onInput` handler), avoid resetting
             * the `autofilled` flag. This should only be reset from actual
             * user interaction with the field to allow autofill overriding. */
            if (!ctx?.service.autofill.processing) {
                field.autofilled = null;
                field.autofilledItemKey = null;
            }

            return (field.value = value);
        }),

        setAction: (action) => {
            if (!action) field.action = null;
            else field.action = validateAction(field, action.type) ? action : null;
        },

        /* if the field is already focused we need to re-dispatch the event on the input
         * element to trigger initial dropdown autofocus. Calling `el.focus()` will not
         * re-dispatch the focus event if it is already the document's active element.
         * In certain cases, we may want to re-focus the element without triggering the
         * attached action effect : as there is no way to attach extra data to a focus event,
         * so we rely on adding custom properties on the field element itself */
        focus(options) {
            if (options?.preventAction) field.preventAction(DOM_SETTLE_MS);
            else actionTrap.release();

            const isFocusedField = isActiveElement(field.element);
            field.element.focus({ preventScroll: true });

            if (isFocusedField && !options?.preventAction) {
                const focusEvent = new FocusEvent('focus', {
                    bubbles: true,
                    cancelable: true,
                    relatedTarget: null,
                });

                field.element.dispatchEvent(focusEvent);
            }

            nextTick(() => field.icon?.reposition());
        },

        autofill: (value, options) => {
            const release = field.preventAction();
            interactivity.unlock();

            return field
                .getVisibility()
                .then(async (visible) => {
                    if (visible) {
                        await createAutofill(element)(value, options);
                        field.autofilled = value ? (options?.type ?? field.fieldType) : null;
                        field.autofilledItemKey = options?.itemKey ?? null;
                    }
                })
                .catch(noop)
                .finally(onNextTick(release));
        },

        setIcon: (val) => {
            field.icon = val;
        },

        getVisibility: withContext(async (ctx) => {
            /** Check if field element is visible (prevents honeypot/hidden field attacks) */
            const visible = ctx && isVisible(element, { opacity: false, skipCache: true });
            if (!visible) return false;

            /** For sub-frames: verify the iframe itself is visible in viewport
             * (prevents hidden iframe injection attacks) */
            if (!ctx.mainFrame) return getFrameParentVisibility();

            return true;
        }),

        attach(tracker) {
            if (!field.tracked && isInputElement(field.element)) {
                field.tracked = true;
                field.tracker = createFieldTracker(field, tracker);
            }
        },

        detach: () => {
            field.tracked = false;
            field.tracker?.detach();
            field.tracker = null;
            field.icon?.detach();
            actionTrap.release();
            interactivity.unlock();
            anchor = null;
        },

        matches: (frameField) => {
            if (!frameField) return false;
            const { fieldId, formId } = frameField;
            return field.fieldId === fieldId && field.formId === formId;
        },

        preventAction: (duration = 250) => {
            return actionTrap.trap(duration);
        },

        /** Returns true if field is focused or has attached inline dropdown */
        isActive: withContext<() => Promise<boolean>>(async (ctx) => {
            const focused = isActiveElement(field.element);
            if (focused) return true;

            return (
                ctx?.service.inline.dropdown
                    .getState(ctx.mainFrame)
                    .then(({ visible, focused, attachedField }) => visible && focused && field.matches(attachedField))
                    .catch(() => false) ?? false
            );
        }),

        sync: () => {
            /** If settings or feature flags have changed, this field's action may
             * have been invalidated. As such, reset the action and detach icon */
            if (field.action && !validateAction(field, field.action.type)) {
                field.action = null;
                field.icon?.detach();
                return;
            }
        },
    };

    return field;
};
