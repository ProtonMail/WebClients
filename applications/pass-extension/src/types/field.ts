import type { CCFieldType, FieldType, IdentityFieldType } from '@proton/pass/fathom/labels';

export type FieldSubTypes = {
    [FieldType.CREDIT_CARD]: CCFieldType;
    [FieldType.IDENTITY]: IdentityFieldType;
    [FieldType.EMAIL]: IdentityFieldType.EMAIL;
};

export type AbstractField<T extends FieldType> = {
    fieldType: T;
    fieldSubType?: T extends keyof FieldSubTypes ? FieldSubTypes[T] : never;
    sectionIndex?: number;
};
