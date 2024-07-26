import type { FieldHandle, FormHandle } from 'proton-pass-extension/app/content/types';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';

import { createAutofillService } from './autofill';

describe('AutofillService', () => {
    const autofillService = createAutofillService();

    describe('identity autofill', () => {
        const MOCK_FORM_HANDLE = {
            getFields: jest.fn().mockReturnValue([
                { element: { autocomplete: 'name' }, autofill: jest.fn() },
                { element: { autocomplete: 'given-name' }, autofill: jest.fn() },
                { element: { autocomplete: 'family-name' }, autofill: jest.fn() },
                { element: { autocomplete: 'additional-name' }, autofill: jest.fn() },
                { element: { autocomplete: 'tel' }, autofill: jest.fn() },
                { element: { autocomplete: 'street-address' }, autofill: jest.fn() },
                { element: { autocomplete: 'address-level1' }, autofill: jest.fn() },
                { element: { autocomplete: 'address-level2' }, autofill: jest.fn() },
                { element: { autocomplete: 'postal-code' }, autofill: jest.fn() },
                { element: { autocomplete: 'organization' }, autofill: jest.fn() },
            ]),
        } as any as FormHandle;

        const MOCK_IDENTITY = itemBuilder('identity').set('content', (content) => {
            content.set('fullName', 'John Middle Doe');
            content.set('firstName', 'John');
            content.set('lastName', 'Doe');
            content.set('middleName', 'Middle');
            content.set('phoneNumber', '1234567890');
            content.set('streetAddress', '1 Street');
            content.set('stateOrProvince', 'IDF');
            content.set('zipOrPostalCode', '12345');
            content.set('countryOrRegion', 'France');
            content.set('city', 'Paris');
            content.set('organization', 'Proton');
            return content;
        }).data.content;

        const getField = (fields: FieldHandle[], autocomplete: AutoFill) => {
            return fields.find((field) => field.element.autocomplete === autocomplete);
        };

        beforeEach(() => {
            MOCK_FORM_HANDLE.getFields().forEach((field) => {
                (field.autofill as jest.Mock).mockClear();
            });
        });

        test('It autofills all expected fields when the item contains all fields', () => {
            autofillService.autofillIdentity(MOCK_FORM_HANDLE, MOCK_IDENTITY);
            const fields = MOCK_FORM_HANDLE.getFields();

            expect(getField(fields, 'name')?.autofill).toHaveBeenCalledWith('John Middle Doe');
            expect(getField(fields, 'given-name')?.autofill).toHaveBeenCalledWith('John');
            expect(getField(fields, 'additional-name')?.autofill).toHaveBeenCalledWith('Middle');
            expect(getField(fields, 'family-name')?.autofill).toHaveBeenCalledWith('Doe');
            expect(getField(fields, 'tel')?.autofill).toHaveBeenCalledWith('1234567890');
            expect(getField(fields, 'street-address')?.autofill).toHaveBeenCalledWith('1 Street');
            expect(getField(fields, 'address-level1')?.autofill).toHaveBeenCalledWith('IDF');
            expect(getField(fields, 'address-level2')?.autofill).toHaveBeenCalledWith('Paris');
            expect(getField(fields, 'postal-code')?.autofill).toHaveBeenCalledWith('12345');
        });

        test('It autofills given-name and family-name if not set but full name is set', () => {
            const identity = itemBuilder('identity').set('content', (content) => {
                content.set('fullName', 'John Middle Doe');
                return content;
            });

            autofillService.autofillIdentity(MOCK_FORM_HANDLE, identity.data.content);
            const fields = MOCK_FORM_HANDLE.getFields();

            expect(getField(fields, 'given-name')?.autofill).toHaveBeenCalledWith('John');
            expect(getField(fields, 'family-name')?.autofill).toHaveBeenCalledWith('Doe');
        });

        test('It autofills given-name and not family-name if only full name is set with a single name', () => {
            const identity = itemBuilder('identity').set('content', (content) => {
                content.set('fullName', 'John');
                return content;
            });

            autofillService.autofillIdentity(MOCK_FORM_HANDLE, identity.data.content);
            const fields = MOCK_FORM_HANDLE.getFields();

            expect(getField(fields, 'given-name')?.autofill).toHaveBeenCalledWith('John');
            expect(getField(fields, 'family-name')?.autofill).toHaveBeenCalledWith('');
            expect(getField(fields, 'additional-name')?.autofill).toHaveBeenCalledWith('');
        });

        test('firstName and lastName have priority over full name for autofill', () => {
            const identity = itemBuilder('identity').set('content', (content) => {
                content.set('fullName', 'John Middle Doe');
                content.set('firstName', 'Hello');
                content.set('lastName', 'World');
                return content;
            });

            autofillService.autofillIdentity(MOCK_FORM_HANDLE, identity.data.content);
            const fields = MOCK_FORM_HANDLE.getFields();

            expect(getField(fields, 'given-name')?.autofill).toHaveBeenCalledWith('Hello');
            expect(getField(fields, 'family-name')?.autofill).toHaveBeenCalledWith('World');
            expect(getField(fields, 'additional-name')?.autofill).toHaveBeenCalledWith('');
        });

        test('It does not autofill if item field is empty', () => {
            const identity = itemBuilder('identity');

            autofillService.autofillIdentity(MOCK_FORM_HANDLE, identity.data.content);
            const fields = MOCK_FORM_HANDLE.getFields();

            fields.forEach((field) => {
                expect(field.autofill).toHaveBeenCalledWith('');
            });
        });
    });
});
