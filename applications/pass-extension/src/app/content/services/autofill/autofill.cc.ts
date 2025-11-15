import { splitFullName } from 'proton-pass-extension/app/content/services/autofill/autofill.identity';
import type { FieldElement, FieldHandle } from 'proton-pass-extension/app/content/services/form/field';

import {
    formatExpirationDate,
    getCCFieldType,
    getExpirationFormat,
    getInputExpirationMonthFormat,
    getInputExpirationYearFormat,
    getSelectExpirationMonthFormat,
    getSelectExpirationYearFormat,
} from '@proton/pass/fathom';
import { CCFieldType, FieldType } from '@proton/pass/fathom/labels';
import type { CCItemData, Maybe } from '@proton/pass/types';
import { isInputElement } from '@proton/pass/utils/dom/predicates';
import { head, last, prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { seq } from '@proton/pass/utils/fp/promises';

type CCFieldValueExtract = (data: Partial<CCItemData>, el: FieldElement) => Maybe<string>;

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

export const autofillCCFields = async (fields: FieldHandle[], data: Partial<CCItemData>): Promise<CCFieldType[]> => {
    const result = await seq(fields, async (field): Promise<Maybe<CCFieldType>> => {
        const ccType = getCCFieldType(field.element);
        if (!ccType) return;

        const value = CC_FIELDS_CONFIG[ccType](data, field.element);
        const next = value || (field.autofilled === FieldType.CREDIT_CARD ? '' : undefined);

        if (next !== undefined) {
            await field.autofill(next);
            return ccType;
        }
    });

    return result.filter(truthy);
};
