import { FieldType } from '@protontech/autofill/types';

import type { AbstractField } from '../../types/field';

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
