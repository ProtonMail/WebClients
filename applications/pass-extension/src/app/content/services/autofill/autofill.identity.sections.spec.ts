import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';

import { FieldType, IdentityFieldType } from '@proton/pass/fathom/labels';

import { resolveIdentitySections } from './autofill.identity.sections';

describe('resolveIdentitySections', () => {
    const createField = (fieldSubType?: IdentityFieldType): FieldHandle =>
        ({
            fieldType: FieldType.IDENTITY,
            fieldSubType,
            element: document.createElement('input'),
        }) as any as FieldHandle;

    test('should return an empty array for empty input', () => {
        expect(resolveIdentitySections([])).toEqual([]);
    });

    test('should ignore non-identity fields', () => {
        expect(
            resolveIdentitySections([
                { fieldType: FieldType.USERNAME } as FieldHandle,
                { fieldType: FieldType.PASSWORD_CURRENT } as FieldHandle,
            ])
        ).toEqual([]);
    });

    test('should group non-critical fields into a single section', () => {
        const result = resolveIdentitySections([
            createField(IdentityFieldType.FIRSTNAME),
            createField(IdentityFieldType.TELEPHONE),
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].types).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.TELEPHONE]));
        expect(result[0].fields).toHaveLength(2);
    });

    test('should create new sections for non-consecutive critical fields', () => {
        const result = resolveIdentitySections([
            createField(IdentityFieldType.FIRSTNAME),
            createField(IdentityFieldType.TELEPHONE),
            createField(IdentityFieldType.FIRSTNAME),
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].types).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.TELEPHONE]));
        expect(result[1].types).toEqual(new Set([IdentityFieldType.FIRSTNAME]));
    });

    test('should not create new sections for consecutive critical fields', () => {
        const result = resolveIdentitySections([
            createField(IdentityFieldType.FIRSTNAME),
            createField(IdentityFieldType.FIRSTNAME),
            createField(IdentityFieldType.TELEPHONE),
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].types).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.TELEPHONE]));
        expect(result[0].fields).toHaveLength(3);
    });

    test('should handle mixed critical and non-critical fields', () => {
        const result = resolveIdentitySections([
            createField(IdentityFieldType.FIRSTNAME),
            createField(IdentityFieldType.ADDRESS),
            createField(IdentityFieldType.FIRSTNAME),
            createField(IdentityFieldType.TELEPHONE),
        ]);

        expect(result).toHaveLength(2);
        expect(result[0].types).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.ADDRESS]));
        expect(result[1].types).toEqual(new Set([IdentityFieldType.FIRSTNAME, IdentityFieldType.TELEPHONE]));
    });

    test('should handle fields with no `identityType`', () => {
        const fields = [createField(), createField(IdentityFieldType.FIRSTNAME)];
        const result = resolveIdentitySections(fields);
        expect(result).toHaveLength(1);
        expect(result[0].types).toEqual(new Set([IdentityFieldType.FIRSTNAME]));
        expect(result[0].fields).toHaveLength(1);
    });
});
