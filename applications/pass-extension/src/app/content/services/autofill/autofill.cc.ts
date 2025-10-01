import { splitFullName } from 'proton-pass-extension/app/content/services/autofill/autofill.identity';
import type { FieldElement, FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import { actionTrap } from 'proton-pass-extension/app/content/utils/action-trap';

import {
    formatExpirationDate,
    getCCFieldType,
    getExpirationFormat,
    getInputExpirationYearFormat,
    getSelectExpirationMonthFormat,
    getSelectExpirationYearFormat,
} from '@proton/pass/fathom';
import { CCFieldType } from '@proton/pass/fathom/labels';
import type { CCItemData, Maybe } from '@proton/pass/types';
import { isInputElement, isSelectElement } from '@proton/pass/utils/dom/predicates';
import { head, last, prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { seq } from '@proton/pass/utils/fp/promises';

type CCFieldValueExtract = (data: CCItemData, el: FieldElement) => Maybe<string>;

const getExpirationDate: CCFieldValueExtract = ({ expirationDate }, el) => {
    if (isInputElement(el)) {
        const [year, month] = expirationDate.split('-');
        const expFormat = getExpirationFormat(el);
        if (expFormat) return formatExpirationDate(month, year, expFormat);
    }
};

const getExpirationYear: CCFieldValueExtract = ({ expirationDate }, el) => {
    const [year] = expirationDate.split('-');
    const format = (() => {
        if (isInputElement(el)) return getInputExpirationYearFormat(el);
        else return getSelectExpirationYearFormat(el);
    })();

    if (format) return format.fullYear ? year : year.slice(-2);
};

const getExpirationMonth: CCFieldValueExtract = ({ expirationDate }, el) => {
    const [, month] = expirationDate.split('-');
    /** Most exp-month fields will accept non-padded month */
    if (isInputElement(el)) return parseInt(month, 10).toString();

    if (isSelectElement(el)) {
        const format = getSelectExpirationMonthFormat(el);
        if (format) {
            return parseInt(month, 10)
                .toString()
                .padStart(format.padding ? 2 : 1, '0');
        }
    }
};

export const CC_FIELDS_CONFIG: Partial<Record<CCFieldType, CCFieldValueExtract>> = {
    [CCFieldType.CSC]: prop('verificationNumber'),
    [CCFieldType.EXP_MONTH]: getExpirationMonth,
    [CCFieldType.EXP_YEAR]: getExpirationYear,
    [CCFieldType.EXP]: getExpirationDate,
    [CCFieldType.FIRSTNAME]: pipe(prop('cardholderName'), splitFullName, head),
    [CCFieldType.LASTNAME]: pipe(prop('cardholderName'), splitFullName, last),
    [CCFieldType.NAME]: prop('cardholderName'),
    [CCFieldType.NUMBER]: prop('number'),
};

export const autofillCCFields = async (fields: FieldHandle[], data: CCItemData) => {
    fields.forEach(({ element }) => actionTrap(element, 250));

    await seq(fields, async (field) => {
        const ccType = getCCFieldType(field.element);
        if (!ccType) return;

        const value = CC_FIELDS_CONFIG[ccType]?.(data, field.element);
        if (value) await field.autofill(value);
    });
};
