import type { FieldHandle } from 'proton-pass-extension/app/content/types';

import { FieldType, IdentityFieldType } from '@proton/pass/fathom';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';

import { autofillIdentityFields, getFirstName, getFullName, getLastName, getMiddleName } from './autofill.identity';

let MOCK_ITEM = itemBuilder('identity');
let MOCK_FIELDS: FieldHandle[] = [];

const createField = (identityType: IdentityFieldType, sectionIndex: number = 1, value: string = '') =>
    ({
        autofilled: null,
        element: { value },
        identityType,
        sectionIndex,
        autofill: jest.fn(),
    }) as any as FieldHandle;

describe('Identity', () => {
    jest.useFakeTimers();

    beforeEach(() => {
        MOCK_FIELDS.length = 0;
        MOCK_ITEM = itemBuilder('identity');
    });

    describe('`getFullName`', () => {
        test('returns trimmed fullName if available', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', '  John  Doe  '));
            expect(getFullName(MOCK_ITEM.data.content)).toBe('John Doe');
        });

        test('constructs fullName from first and last name', () => {
            MOCK_ITEM.set('content', (content) => content.set('firstName', 'John').set('lastName', 'Doe'));
            expect(getFullName(MOCK_ITEM.data.content)).toBe('John Doe');
        });

        test('constructs fullName omitting empty parts', () => {
            MOCK_ITEM.set('content', (content) => content.set('lastName', 'John'));
            expect(getFullName(MOCK_ITEM.data.content)).toBe('John');
        });

        test('returns undefined if no name parts are available', () => {
            expect(getFullName(MOCK_ITEM.data.content)).toBeUndefined();
        });
    });

    describe('`getMiddleName`', () => {
        test('returns trimmed middleName if available', () => {
            MOCK_ITEM.set('content', (content) => content.set('middleName', '  Jane  '));
            expect(getMiddleName(MOCK_ITEM.data.content)).toBe('Jane');
        });

        test('derives middle name from fullName if middleName is not available', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Jane Doe'));
            expect(getMiddleName(MOCK_ITEM.data.content)).toBe('Jane');
        });

        test('handles multiple middle names', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Jane Mary Doe'));
            expect(getMiddleName(MOCK_ITEM.data.content)).toBe('Jane Mary');
        });

        test('returns undefined if no middle name can be derived', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Doe'));
            expect(getMiddleName(MOCK_ITEM.data.content)).toBeUndefined();
        });

        test('returns undefined if fullName is not available', () => {
            MOCK_ITEM.set('content', (content) => content.set('firstName', 'John').set('lastName', 'Doe'));
            expect(getMiddleName(MOCK_ITEM.data.content)).toBeUndefined();
        });
    });

    describe('`getFirstName`', () => {
        test('returns trimmed firstName if available', () => {
            MOCK_ITEM.set('content', (content) => content.set('firstName', '  John  ').set('fullName', 'John Doe'));
            expect(getFirstName(MOCK_ITEM.data.content)).toBe('John');
        });

        test('derives firstName from fullName if firstName is not available', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Doe'));
            expect(getFirstName(MOCK_ITEM.data.content)).toBe('John');
        });

        test('handles multiple whitespaces in fullName', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', '  John   Doe  Smith  '));
            expect(getFirstName(MOCK_ITEM.data.content)).toBe('John');
        });

        test('returns undefined if neither firstName nor fullName are available', () => {
            expect(getFirstName(MOCK_ITEM.data.content)).toBeUndefined();
        });
    });

    describe('`getLastName`', () => {
        test('returns trimmed lastName if available', () => {
            MOCK_ITEM.set('content', (content) => content.set('lastName', '  Doe  ').set('fullName', 'John Doe'));
            expect(getLastName(MOCK_ITEM.data.content)).toBe('Doe');
        });

        test('derives lastName from fullName if lastName is not available', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Van Der Doe'));
            expect(getLastName(MOCK_ITEM.data.content)).toBe('Doe');
        });

        test('handles multiple whitespaces in fullName', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', '  John   Doe  Smith  '));
            expect(getLastName(MOCK_ITEM.data.content)).toBe('Smith');
        });

        test('returns undefined for single word fullName', () => {
            MOCK_ITEM.set('content', (content) => content.set('fullName', 'John'));
            expect(getLastName(MOCK_ITEM.data.content)).toBeUndefined();
        });

        test('returns undefined if neither lastName nor fullName are available', () => {
            expect(getLastName(MOCK_ITEM.data.content)).toBeUndefined();
        });
    });

    describe('`autofillIdentityFields`', () => {
        test('it autofills fields with different types', () => {
            MOCK_FIELDS.push(
                createField(IdentityFieldType.FIRSTNAME),
                createField(IdentityFieldType.LASTNAME),
                createField(IdentityFieldType.ADDRESS),
                createField(IdentityFieldType.ZIPCODE)
            );

            MOCK_ITEM.set('content', (content) => {
                content.set('firstName', 'John');
                content.set('lastName', 'Doe');
                content.set('streetAddress', '123 Main St');
                content.set('zipOrPostalCode', '12345');
                return content;
            });

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0]?.autofill).toHaveBeenCalledWith('John', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[1]?.autofill).toHaveBeenCalledWith('Doe', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[2]?.autofill).toHaveBeenCalledWith('123 Main St', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[3]?.autofill).toHaveBeenCalledWith('12345', { type: FieldType.IDENTITY });
        });

        test('it skips consecutive fields when autofilling', () => {
            MOCK_FIELDS.push(
                createField(IdentityFieldType.FIRSTNAME),
                createField(IdentityFieldType.FIRSTNAME),
                createField(IdentityFieldType.LASTNAME),
                createField(IdentityFieldType.LASTNAME)
            );

            MOCK_ITEM.set('content', (content) => {
                content.set('firstName', 'John');
                content.set('lastName', 'Doe');
                return content;
            });

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0].autofill).toHaveBeenCalledWith('John', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[1].autofill).not.toHaveBeenCalled();
            expect(MOCK_FIELDS[2].autofill).toHaveBeenCalledWith('Doe', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[3].autofill).not.toHaveBeenCalled();
        });

        test('it skips already autofilled fields', () => {
            const field = createField(IdentityFieldType.EMAIL);
            field.autofilled = FieldType.EMAIL;

            MOCK_FIELDS.push(field);
            MOCK_ITEM.set('content', (content) => content.set('email', 'test@proton.me'));

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0].autofill).not.toHaveBeenCalled();
        });

        test('it does not autofill fields when no matching data is available', () => {
            MOCK_FIELDS.push(
                createField(IdentityFieldType.FIRSTNAME),
                createField(IdentityFieldType.LASTNAME),
                createField(IdentityFieldType.ADDRESS)
            );

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0]?.autofill).not.toHaveBeenCalled();
            expect(MOCK_FIELDS[1]?.autofill).not.toHaveBeenCalled();
            expect(MOCK_FIELDS[2]?.autofill).not.toHaveBeenCalled();
        });

        test('it autofills name fields from fullName when individual fields are not available', () => {
            MOCK_FIELDS.push(
                createField(IdentityFieldType.FIRSTNAME),
                createField(IdentityFieldType.MIDDLENAME),
                createField(IdentityFieldType.LASTNAME)
            );

            MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Middle Doe'));

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0]?.autofill).toHaveBeenCalledWith('John', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[1]?.autofill).toHaveBeenCalledWith('Middle', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[2]?.autofill).toHaveBeenCalledWith('Doe', { type: FieldType.IDENTITY });
        });

        test('it handles single-word fullName', () => {
            MOCK_FIELDS.push(
                createField(IdentityFieldType.FIRSTNAME),
                createField(IdentityFieldType.MIDDLENAME),
                createField(IdentityFieldType.LASTNAME)
            );

            MOCK_ITEM.set('content', (content) => content.set('fullName', 'John'));

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0]?.autofill).toHaveBeenCalledWith('John', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[1]?.autofill).not.toHaveBeenCalled();
            expect(MOCK_FIELDS[2]?.autofill).not.toHaveBeenCalled();
        });

        test('it autofills address fields of different types', () => {
            MOCK_FIELDS.push(createField(IdentityFieldType.ADDRESS), createField(IdentityFieldType.ZIPCODE));
            MOCK_ITEM.set('content', (content) => {
                content.set('streetAddress', '123 Main St');
                content.set('city', 'Anytown');
                content.set('stateOrProvince', 'State');
                content.set('zipOrPostalCode', '12345');
                return content;
            });

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0]?.autofill).toHaveBeenCalledWith('123 Main St', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[1]?.autofill).toHaveBeenCalledWith('12345', { type: FieldType.IDENTITY });
        });

        test('it autofills only the first occurrence of address fields with the same type', () => {
            MOCK_FIELDS.push(
                createField(IdentityFieldType.ADDRESS),
                createField(IdentityFieldType.CITY),
                createField(IdentityFieldType.ADDRESS)
            );

            MOCK_ITEM.set('content', (content) => content.set('streetAddress', '123 Main St'));

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0]?.autofill).toHaveBeenCalledWith('123 Main St', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[1]?.autofill).not.toHaveBeenCalled();
            expect(MOCK_FIELDS[2]?.autofill).not.toHaveBeenCalled();
        });

        test('it autofills only the first occurrence of telephone fields with the same type', () => {
            MOCK_FIELDS.push(
                createField(IdentityFieldType.TELEPHONE),
                createField(IdentityFieldType.TELEPHONE),
                createField(IdentityFieldType.TELEPHONE),
                createField(IdentityFieldType.TELEPHONE)
            );

            MOCK_ITEM.set('content', (content) => content.set('phoneNumber', '1234567890'));

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0].autofill).toHaveBeenCalledWith('1234567890', { type: FieldType.IDENTITY });
            expect(MOCK_FIELDS[1].autofill).not.toHaveBeenCalled();
            expect(MOCK_FIELDS[2].autofill).not.toHaveBeenCalled();
            expect(MOCK_FIELDS[3].autofill).not.toHaveBeenCalled();
        });

        test('it autofills organization', () => {
            MOCK_FIELDS.push(createField(IdentityFieldType.ORGANIZATION));
            MOCK_ITEM.set('content', (content) => content.set('organization', 'Proton'));

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0]?.autofill).toHaveBeenCalledWith('Proton', { type: FieldType.IDENTITY });
        });

        test('it handles partial address data', () => {
            MOCK_FIELDS.push(createField(IdentityFieldType.ADDRESS), createField(IdentityFieldType.ZIPCODE));

            MOCK_ITEM.set('content', (content) => {
                content.set('city', 'Meudon');
                content.set('zipOrPostalCode', '92190');
                return content;
            });

            autofillIdentityFields(MOCK_FIELDS, MOCK_FIELDS[0], MOCK_ITEM.data.content);
            jest.runAllTimers();

            expect(MOCK_FIELDS[0]?.autofill).not.toHaveBeenCalled();
            expect(MOCK_FIELDS[1]?.autofill).toHaveBeenCalledWith('92190', { type: FieldType.IDENTITY });
        });
    });
});
