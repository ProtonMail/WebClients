import { splitFullName } from 'proton-pass-extension/app/content/services/autofill/autofill.identity';
import type { FieldElement, FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { AutofillRequest } from 'proton-pass-extension/types/autofill';

import {
    formatExpirationDate,
    getExpirationFormat,
    getInputExpirationMonthFormat,
    getInputExpirationYearFormat,
    getSelectExpirationMonthFormat,
    getSelectExpirationYearFormat,
} from '@proton/pass/fathom';
import { CCFieldType, FieldType } from '@proton/pass/fathom/labels';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import type { Maybe } from '@proton/pass/types/utils/index';
import type { CCItemData } from '@proton/pass/types/worker/data';
import { isInputElement } from '@proton/pass/utils/dom/predicates';
import { head, last, prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { seq } from '@proton/pass/utils/fp/promises';

type CCFieldValueExtract = (data: Partial<CCItemData>, el: FieldElement) => Maybe<string>;
type CCAutofillRequest = AutofillRequest<'fill'> & { type: 'creditCard' };

const getExpirationDate: CCFieldValueExtract = ({ expirationDate }, el) => {
    if (expirationDate && isInputElement(el)) {
        const [year, month] = expirationDate.split('-');
        const expFormat = getExpirationFormat(el);
        if (expFormat) return formatExpirationDate(month, year, expFormat);
    }
};

const getExpirationYear: CCFieldValueExtract = ({ expirationDate }, el) => {
    if (expirationDate) {
        const [year] = expirationDate.split('-');
        const format = (() => {
            if (isInputElement(el)) return getInputExpirationYearFormat(el);
            else return getSelectExpirationYearFormat(el);
        })();

        if (format) return format.fullYear ? year : year.slice(-2);
    }
};

const getExpirationMonth: CCFieldValueExtract = ({ expirationDate }, el) => {
    if (expirationDate) {
        const [, month] = expirationDate.split('-');
        const format = isInputElement(el) ? getInputExpirationMonthFormat(el) : getSelectExpirationMonthFormat(el);

        if (format) {
            return parseInt(month, 10)
                .toString()
                .padStart(format.padding ? 2 : 1, '0');
        }
    }
};

export const CC_FIELDS_CONFIG: Record<CCFieldType, CCFieldValueExtract> = {
    [CCFieldType.CSC]: prop('verificationNumber'),
    [CCFieldType.EXP_MONTH]: getExpirationMonth,
    [CCFieldType.EXP_YEAR]: getExpirationYear,
    [CCFieldType.EXP]: getExpirationDate,
    [CCFieldType.FIRSTNAME]: pipe(prop('cardholderName'), splitFullName, head),
    [CCFieldType.LASTNAME]: pipe(prop('cardholderName'), splitFullName, last),
    [CCFieldType.NAME]: prop('cardholderName'),
    [CCFieldType.NUMBER]: prop('number'),
};

const sanitizeCCNumber = (value: string) => value.replace(/[\s-]/g, '');

/** Detects whether a credit card number field is being autofilled with the same
 * value it already contains. This prevents a problematic cycle on certain forms
 * (eg: payment pages where focusing the CC number field clears the CVC field):
 * 1. User autofills CC number and CVC
 * 2. Form clears CVC when CC number is re-focused
 * 3. User attempts to re-autofill just the CVC
 * 4. Without this check, the CC number would be re-autofilled, triggering step 2 again
 * By detecting this, we skip the unnecessary re-fill and break the cycle. */
const isDuplicateCCNumberAutofill = (value: string, field: FieldHandle, payload: CCAutofillRequest): boolean => {
    if (field.fieldSubType !== CCFieldType.NUMBER) return false;
    if (!field.autofilledItemKey) return false;
    if (field.autofilledItemKey !== getItemKey(payload)) return false;

    /** Secure forms may obfuscate the CC number as `******1234`, so compare
     * only the last 4 digits to determine if the value is unchanged. */
    const last4Digits = sanitizeCCNumber(field.element.value).slice(-4);
    return last4Digits === value.slice(-4);
};

export const autofillCCFields = async (
    fields: FieldHandle<FieldType.CREDIT_CARD>[],
    payload: CCAutofillRequest
): Promise<CCFieldType[]> => {
    const result = await seq(fields, async (field, autofilled): Promise<Maybe<CCFieldType>> => {
        const ccType = field.fieldSubType;

        /** No match or `CCFieldType` has already been autofilled */
        if (!ccType || autofilled.includes(ccType)) return;

        const value = CC_FIELDS_CONFIG[ccType](payload.data, field.element);
        const next = value || (field.autofilled === FieldType.CREDIT_CARD ? '' : undefined);

        if (next !== undefined) {
            /** cc-number fields are likely to have auto-formatting on
             * keyboard/input events - adapt the autofill accordingly */
            const maskedInput = ccType === CCFieldType.NUMBER;

            const duplicate = isDuplicateCCNumberAutofill(next, field, payload);
            if (!duplicate) await field.autofill(next, { itemKey: getItemKey(payload), maskedInput });

            return ccType;
        }
    });

    return result.filter(truthy);
};
