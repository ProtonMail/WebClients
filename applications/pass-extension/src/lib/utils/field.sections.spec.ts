import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';

import { CCFieldType, FieldType, IdentityFieldType } from '@proton/pass/fathom/labels';

import type { FieldSubType } from './field.sections';
import { resolveFieldSections } from './field.sections';

describe('resolveFieldSections', () => {
    const createField = (fieldType: FieldType, fieldSubType?: FieldSubType): FieldHandle =>
        ({
            fieldType,
            fieldSubType,
            element: document.createElement('input'),
        }) as any as FieldHandle;

    test('should return an empty array for empty input', () => {
        expect(resolveFieldSections([])).toEqual([]);
    });

    test('should ignore non-identity fields', () => {
        expect(
            resolveFieldSections([createField(FieldType.USERNAME), createField(FieldType.PASSWORD_CURRENT)])
        ).toEqual([]);
    });

    test('should group non-critical fields into a single section', () => {
        const result = resolveFieldSections([
            createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME),
            createField(FieldType.IDENTITY, IdentityFieldType.TELEPHONE),
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].subTypes).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.TELEPHONE]));
        expect(result[0].type).toEqual(FieldType.IDENTITY);
    });

    test('should create new sections for non-consecutive critical fields', () => {
        const result = resolveFieldSections([
            createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME),
            createField(FieldType.IDENTITY, IdentityFieldType.TELEPHONE),
            createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME),
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].subTypes).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.TELEPHONE]));
        expect(result[0].type).toEqual(FieldType.IDENTITY);
        expect(result[1].subTypes).toEqual(new Set([IdentityFieldType.FIRSTNAME]));
        expect(result[1].type).toEqual(FieldType.IDENTITY);
    });

    test('should not create new sections for consecutive critical identity fields', () => {
        const result = resolveFieldSections([
            createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME),
            createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME),
            createField(FieldType.IDENTITY, IdentityFieldType.TELEPHONE),
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].subTypes).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.TELEPHONE]));
        expect(result[0].type).toEqual(FieldType.IDENTITY);
    });

    test('should create new sections for consecutive critical cc fields', () => {
        const result = resolveFieldSections([
            createField(FieldType.CREDIT_CARD, CCFieldType.NUMBER),
            createField(FieldType.CREDIT_CARD, CCFieldType.NUMBER),
            createField(FieldType.CREDIT_CARD, CCFieldType.CSC),
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].subTypes).toEqual(new Set([CCFieldType.NUMBER]));
        expect(result[0].type).toEqual(FieldType.CREDIT_CARD);
        expect(result[1].subTypes).toEqual(new Set([CCFieldType.NUMBER, CCFieldType.CSC]));
        expect(result[1].type).toEqual(FieldType.CREDIT_CARD);
    });

    test('should handle mixed critical and non-critical fields', () => {
        const result = resolveFieldSections([
            createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME),
            createField(FieldType.IDENTITY, IdentityFieldType.ADDRESS),
            createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME),
            createField(FieldType.IDENTITY, IdentityFieldType.TELEPHONE),
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].subTypes).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.ADDRESS]));
        expect(result[0].type).toEqual(FieldType.IDENTITY);
        expect(result[1].subTypes).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.TELEPHONE]));
        expect(result[1].type).toEqual(FieldType.IDENTITY);
    });

    test('should handle mixed cc/identity fields', () => {
        const result = resolveFieldSections([
            createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME),
            createField(FieldType.IDENTITY, IdentityFieldType.LASTNAME),
            createField(FieldType.CREDIT_CARD, CCFieldType.NUMBER),
            createField(FieldType.CREDIT_CARD, CCFieldType.CSC),
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].subTypes).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.LASTNAME]));
        expect(result[0].type).toEqual(FieldType.IDENTITY);
        expect(result[1].subTypes).toEqual(new Set([CCFieldType.NUMBER, CCFieldType.CSC]));
        expect(result[1].type).toEqual(FieldType.CREDIT_CARD);
    });

    test('should handle fields with no `identityType`', () => {
        const fields = [createField(FieldType.USERNAME), createField(FieldType.IDENTITY, IdentityFieldType.FIRSTNAME)];
        const result = resolveFieldSections(fields);
        expect(result).toHaveLength(1);
        expect(result[0].subTypes).toEqual(new Set([IdentityFieldType.FIRSTNAME]));
        expect(result[0].fields).toHaveLength(1);
        expect(result[0].type).toEqual(FieldType.IDENTITY);
    });
});
