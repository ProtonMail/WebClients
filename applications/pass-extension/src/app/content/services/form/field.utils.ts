import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { getFrameID } from 'proton-pass-extension/app/content/utils/frame';

import { CCFieldType, FieldType } from '@proton/pass/fathom/labels';
import { enableLoginAutofill } from '@proton/pass/lib/settings/utils';

import type { FieldHandle } from './field';

export const validateCCField = (field: FieldHandle): boolean => {
    switch (field.fieldSubType) {
        case CCFieldType.EXP:
        case CCFieldType.EXP_YEAR:
        case CCFieldType.EXP_MONTH:
            /** Expiration date fields can match non-payment contexts. In iframes, we trust
             * positive detections as payment forms are typically embedded for PCI compliance. */
            if (getFrameID() !== 0) return true;
            else {
                /** In top-frame contexts, we require additional evidence to avoid false
                 * positives: either other unambiguous CC fields (number, CVV, name) in
                 * the same form, or a payment-like form with fields spanning into iframes. */
                const form = field.getFormHandle();
                const hasCCFields = form.getFieldsFor(
                    FieldType.CREDIT_CARD,
                    (field) =>
                        field.fieldSubType === CCFieldType.FIRSTNAME ||
                        field.fieldSubType === CCFieldType.LASTNAME ||
                        field.fieldSubType === CCFieldType.NAME ||
                        field.fieldSubType === CCFieldType.NUMBER ||
                        field.fieldSubType === CCFieldType.CSC
                );
                return hasCCFields.length > 0 || field.getFormHandle().hasFrameFields();
            }
        default:
            return true;
    }
};

export const validateAction = withContext<(field: FieldHandle, action: DropdownAction) => boolean>(
    (ctx, field, action) => {
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
                return Boolean(features?.CreditCard) && validateCCField(field);
        }
    }
);

/** Flags an element to block certain autofill/autosave actions triggered on focus
 * in/out events. This is necessary as we cannot directly attach data to these DOM
 * events, so we rely on Element flags. Returns a function to release the trap. */
export const createElementTrap = <K extends string>(element: HTMLElement, key: K) => {
    const el = element as Record<K, boolean>;
    const state: { timer?: NodeJS.Timeout } = {};

    const release = () => {
        el[key] = false;
        clearTimeout(state.timer);
        delete state.timer;
    };

    return {
        release,

        isTrapped: () => el[key] === true,

        trap: (duration: number) => {
            clearTimeout(state.timer);
            el[key] = true;

            state.timer = setTimeout(() => {
                el[key] = false;
                delete state.timer;
            }, duration);

            return release;
        },
    };
};

/** Observer configuration to watch for validation state changes
 * that require repositioning injected elements. Monitors aria and
 * data attributes commonly updated during form validation */
export const FIELD_ATTRS_FILTER = {
    attributes: true,
    attributeFilter: ['aria-invalid', 'aria-describedby', 'aria-errormessage', 'data-invalid', 'data-error'],
};
