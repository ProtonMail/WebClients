import type { FieldHandle } from 'proton-pass-extension/app/content/types';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';

import { autofillIdentityFields, getFirstName, getFullName, getLastName, getMiddleName } from './autofill.identity';

let MOCK_ITEM = itemBuilder('identity');
let MOCK_FIELDS: FieldHandle[] = [];

const getField = (autocomplete: AutoFill) => MOCK_FIELDS.find((field) => field.element.autocomplete === autocomplete);

const createField = (autocomplete: string, value: string = '') =>
    ({ element: { autocomplete, value }, autofill: jest.fn() }) as any as FieldHandle;

describe('Identity', () => {
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
        describe('Name fields', () => {
            test('it autofills `fullName` when available', () => {
                MOCK_FIELDS.push(createField('name'));
                MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Doe'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('name')?.autofill).toHaveBeenCalledWith('John Doe');
            });

            test('it autofills name subfields when available', () => {
                MOCK_FIELDS.push(createField('given-name'), createField('additional-name'), createField('family-name'));
                MOCK_ITEM.set('content', (content) => {
                    content.set('firstName', 'John');
                    content.set('middleName', 'Middle');
                    content.set('lastName', 'Doe');
                    return content;
                });

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('given-name')?.autofill).toHaveBeenCalledWith('John');
                expect(getField('additional-name')?.autofill).toHaveBeenCalledWith('Middle');
                expect(getField('family-name')?.autofill).toHaveBeenCalledWith('Doe');
            });

            test('it derives subfields from `fullName`', () => {
                MOCK_FIELDS.push(createField('given-name'), createField('additional-name'), createField('family-name'));
                MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Michael Charles Doe'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('given-name')?.autofill).toHaveBeenCalledWith('John');
                expect(getField('additional-name')?.autofill).toHaveBeenCalledWith('Michael Charles');
                expect(getField('family-name')?.autofill).toHaveBeenCalledWith('Doe');
            });

            test('it derives `fullName` from subfields', () => {
                MOCK_FIELDS.push(createField('name'));
                MOCK_ITEM.set('content', (content) => {
                    content.set('firstName', 'John');
                    content.set('lastName', 'Doe');
                    return content;
                });

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('name')?.autofill).toHaveBeenCalledWith('John Doe');
            });

            test('it prioritizes subfields over `fullName`', () => {
                MOCK_FIELDS.push(createField('name'), createField('given-name'), createField('family-name'));
                MOCK_ITEM.set('content', (content) => {
                    content.set('fullName', 'John Doe');
                    content.set('firstName', 'Jane');
                    content.set('lastName', 'Smith');
                    return content;
                });

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('name')?.autofill).not.toHaveBeenCalled();
                expect(getField('given-name')?.autofill).toHaveBeenCalledWith('Jane');
                expect(getField('family-name')?.autofill).toHaveBeenCalledWith('Smith');
            });

            test('it handles missing subfields', () => {
                MOCK_FIELDS.push(createField('given-name'), createField('family-name'));
                MOCK_ITEM.set('content', (content) => {
                    content.set('firstName', 'John');
                    return content;
                });

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('given-name')?.autofill).toHaveBeenCalledWith('John');
                expect(getField('family-name')?.autofill).not.toHaveBeenCalled();
            });

            test('it handles single-word fullName', () => {
                MOCK_FIELDS.push(createField('name'), createField('given-name'), createField('family-name'));
                MOCK_ITEM.set('content', (content) => content.set('fullName', 'Doe'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('name')?.autofill).not.toHaveBeenCalled();
                expect(getField('given-name')?.autofill).toHaveBeenCalledWith('Doe');
                expect(getField('family-name')?.autofill).not.toHaveBeenCalled();
            });

            test('it trims whitespace from name fields', () => {
                MOCK_FIELDS.push(createField('given-name'), createField('family-name'));
                MOCK_ITEM.set('content', (content) => {
                    content.set('firstName', '  John  ');
                    content.set('lastName', '  Doe  ');
                    return content;
                });

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('given-name')?.autofill).toHaveBeenCalledWith('John');
                expect(getField('family-name')?.autofill).toHaveBeenCalledWith('Doe');
            });
        });

        describe('Address fields', () => {
            test('it autofills complete address', () => {
                MOCK_FIELDS.push(
                    createField('street-address'),
                    createField('address-level2'),
                    createField('address-level1'),
                    createField('postal-code'),
                    createField('country')
                );

                MOCK_ITEM.set('content', (content) => {
                    content.set('streetAddress', '123 Main St');
                    content.set('city', 'Meudon');
                    content.set('stateOrProvince', 'State');
                    content.set('zipOrPostalCode', '92190');
                    content.set('countryOrRegion', 'Country');
                    return content;
                });

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('street-address')?.autofill).toHaveBeenCalledWith('123 Main St');
                expect(getField('address-level2')?.autofill).toHaveBeenCalledWith('Meudon');
                expect(getField('address-level1')?.autofill).toHaveBeenCalledWith('State');
                expect(getField('postal-code')?.autofill).toHaveBeenCalledWith('92190');
                expect(getField('country')?.autofill).toHaveBeenCalledWith('Country');
            });

            test('it autofills address subfields', () => {
                MOCK_FIELDS.push(
                    createField('address-line1'),
                    createField('address-line2'),
                    createField('address-line3')
                );

                MOCK_ITEM.set('content', (content) => content.set('streetAddress', '123 Main St'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('address-line1')?.autofill).toHaveBeenCalledWith('123 Main St');
                expect(getField('address-line2')?.autofill).not.toHaveBeenCalled();
                expect(getField('address-line3')?.autofill).not.toHaveBeenCalled();
            });

            test('it autofills country', () => {
                MOCK_FIELDS.push(createField('country'), createField('country-name'));
                MOCK_ITEM.set('content', (content) => content.set('countryOrRegion', 'United States'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('country')?.autofill).not.toHaveBeenCalled();
                expect(getField('country-name')?.autofill).toHaveBeenCalledWith('United States');
            });

            test('it prioritizes subfields over `streetAddress`', () => {
                MOCK_FIELDS.push(createField('street-address'), createField('address-line1'));
                MOCK_ITEM.set('content', (content) => content.set('streetAddress', '123 Main St'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('street-address')?.autofill).not.toHaveBeenCalled();
                expect(getField('address-line1')?.autofill).toHaveBeenCalledWith('123 Main St');
            });

            test('it derives address subfields from `streetAddress`', () => {
                MOCK_FIELDS.push(createField('address-line1'));
                MOCK_ITEM.set('content', (content) => content.set('streetAddress', '123 Main St'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('address-line1')?.autofill).toHaveBeenCalledWith('123 Main St');
            });

            test('it handles partial address data', () => {
                MOCK_FIELDS.push(
                    createField('street-address'),
                    createField('address-level2'),
                    createField('address-level1'),
                    createField('postal-code')
                );

                MOCK_ITEM.set('content', (content) => {
                    content.set('city', 'Meudon');
                    content.set('zipOrPostalCode', '92190');
                    return content;
                });

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('street-address')?.autofill).not.toHaveBeenCalled();
                expect(getField('address-level2')?.autofill).toHaveBeenCalledWith('Meudon');
                expect(getField('address-level1')?.autofill).not.toHaveBeenCalled();
                expect(getField('postal-code')?.autofill).toHaveBeenCalledWith('92190');
            });

            test('it does not autofill address-line2 and address-line3', () => {
                MOCK_FIELDS.push(
                    createField('address-line1'),
                    createField('address-line2'),
                    createField('address-line3')
                );

                MOCK_ITEM.set('content', (content) => content.set('streetAddress', '123 Main St'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('address-line1')?.autofill).toHaveBeenCalledWith('123 Main St');
                expect(getField('address-line2')?.autofill).not.toHaveBeenCalled();
                expect(getField('address-line3')?.autofill).not.toHaveBeenCalled();
            });

            test('it autofills organization', () => {
                MOCK_FIELDS.push(createField('organization'));
                MOCK_ITEM.set('content', (content) => content.set('organization', 'Proton'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('organization')?.autofill).toHaveBeenCalledWith('Proton');
            });
        });

        describe('Telephone fields', () => {
            test('it autofills main `tel` field with `phoneNumber`', () => {
                MOCK_FIELDS.push(createField('tel'));
                MOCK_ITEM.set('content', (content) => content.set('phoneNumber', '1234567890'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('tel')?.autofill).toHaveBeenCalledWith('1234567890');
            });

            test('it derives `tel` subfields', () => {
                MOCK_FIELDS.push(createField('tel'), createField('tel-national'), createField('tel-local'));
                MOCK_ITEM.set('content', (content) => content.set('phoneNumber', '1234567890'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('tel')?.autofill).toHaveBeenCalledWith('1234567890');
                expect(getField('tel-national')?.autofill).toHaveBeenCalledWith('1234567890');
                expect(getField('tel-local')?.autofill).toHaveBeenCalledWith('1234567890');
            });
        });

        describe('edge-cases', () => {
            test('it skips unrecognized autocomplete attributes', () => {
                MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Doe'));
                MOCK_FIELDS.push(createField('unknown-attribute'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(getField('unknown-attribute' as any)?.autofill).not.toHaveBeenCalled();
            });

            test('it handles forms with multiple fields of the same type', () => {
                MOCK_ITEM.set('content', (content) => content.set('fullName', 'John Doe'));
                MOCK_FIELDS.push(createField('name'), createField('name'));

                autofillIdentityFields(MOCK_FIELDS, MOCK_ITEM.data.content);
                expect(MOCK_FIELDS[0].autofill).toHaveBeenCalledWith('John Doe');
                expect(MOCK_FIELDS[1].autofill).toHaveBeenCalledWith('John Doe');
            });
        });
    });
});
