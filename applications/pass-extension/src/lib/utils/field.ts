import type { AbstractField } from 'proton-pass-extension/types/field';

import { FieldType } from '@proton/pass/fathom/labels';

export const isEmailField = <T extends AbstractField<FieldType>>(
    field: T
): field is T & AbstractField<FieldType.EMAIL> => field.fieldType === FieldType.EMAIL;

export const isCCField = <T extends AbstractField<FieldType>>(
    field: T
): field is Required<T & AbstractField<FieldType.CREDIT_CARD>> =>
    field.fieldType === FieldType.CREDIT_CARD && field.fieldSubType !== undefined;

export const isIdentityField = <T extends AbstractField<FieldType>>(
    field: T
): field is Required<T & AbstractField<FieldType.IDENTITY>> =>
    field.fieldType === FieldType.IDENTITY && field.fieldSubType !== undefined;
