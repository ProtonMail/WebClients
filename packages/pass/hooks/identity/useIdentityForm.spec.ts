import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { IdentityFieldName } from '@proton/pass/types';

import { MOCK_FIELDS, MOCK_SECTIONS } from './identity.mocks';
import { addFormSectionOptionalField, buildFormSections } from './useIdentityForm';
import * as utils from './utils';

describe('`buildFormSections`', () => {
    beforeEach(() => {
        jest.spyOn(utils, 'getIdentityFields').mockReturnValue(MOCK_FIELDS);
        jest.spyOn(utils, 'getInitialSections').mockReturnValue(MOCK_SECTIONS);
    });

    afterEach(() => jest.resetAllMocks());

    it('should build form sections correctly', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('fullName', 'John Doe');
            content.set('email', 'john@example.com');
            return content;
        });

        const result = buildFormSections(item.data.content, true);
        expect(result.length).toBe(2);

        expect(result[0].name).toBe('Personal');
        expect(result[0].expanded).toBe(true);
        expect(result[0].fields).toEqual(MOCK_SECTIONS[0].fields);
        expect(result[0].optionalFields).toEqual(MOCK_SECTIONS[0].optionalFields);

        expect(result[1].name).toBe('Contact');
        expect(result[1].expanded).toBe(true);
        expect(result[1].fields).toEqual(MOCK_SECTIONS[1].fields);
        expect(result[1].optionalFields).toEqual(MOCK_SECTIONS[1].optionalFields);
    });

    it('should use default `expand` value when editing is false and fields are empty', () => {
        const item = itemBuilder('identity');
        const result = buildFormSections(item.data.content, false);
        expect(result[0].expanded).toBe(true);
        expect(result[1].expanded).toBe(false);
    });

    it('should expand sections when editing is true if section has non-empty fields', () => {
        const item = itemBuilder('identity');
        item.set('content', (content) => content.set('email', 'john@example.com'));

        const result = buildFormSections(item.data.content, true);
        expect(result[0].expanded).toBe(false);
        expect(result[1].expanded).toBe(true);
    });

    it('should expand sections when editing is true if section has custom fields', () => {
        const item = itemBuilder('identity');
        item.set('content', (content) =>
            content.set('extraContactDetails', [{ type: 'text', fieldName: 'test', data: { content: 'test' } }])
        );

        const result = buildFormSections(item.data.content, true);
        expect(result[0].expanded).toBe(false);
        expect(result[1].expanded).toBe(true);
    });

    it('should handle optional fields correctly', () => {
        const item = itemBuilder('identity');
        item.set('content', (content) => {
            content.set('email', 'john@example.com');
            content.set('phoneNumber', '1234567890');
            return content;
        });

        const result = buildFormSections(item.data.content, true);
        expect(result[0].fields).toEqual(MOCK_SECTIONS[0].fields);
        expect(result[0].optionalFields).toEqual(MOCK_SECTIONS[0].optionalFields);

        expect(result[1].fields).toContain(MOCK_FIELDS.email);
        expect(result[1].optionalFields?.length).toBe(0);
    });

    it('should handle empty values', () => {
        const item = itemBuilder('identity');
        const result = buildFormSections(item.data.content, true);

        expect(result[0].fields).toEqual(MOCK_SECTIONS[0].fields);
        expect(result[0].optionalFields).toEqual(MOCK_SECTIONS[0].optionalFields);
        expect(result[0].expanded).toBe(false);

        expect(result[1].fields).toEqual(MOCK_SECTIONS[1].fields);
        expect(result[1].optionalFields).toEqual(MOCK_SECTIONS[1].optionalFields);
        expect(result[1].expanded).toBe(false);
    });
});

describe('`addFormSectionOptionalField`', () => {
    it('should handle adding an optional field to the specified section index', () => {
        const result = addFormSectionOptionalField(1, 'phoneNumber')(MOCK_SECTIONS);
        expect(result[1].fields.length).toBe(2);
        expect(result[1].fields).toEqual([MOCK_FIELDS.email, MOCK_FIELDS.phoneNumber]);
        expect(result[1].optionalFields?.length).toBe(0);
    });

    it('should not modify other sections', () => {
        const result = addFormSectionOptionalField(1, 'phoneNumber')(MOCK_SECTIONS);
        expect(result[0]).toEqual(MOCK_SECTIONS[0]);
    });

    it('should noop if section index is out of range', () => {
        const result = addFormSectionOptionalField(999, 'phoneNumber')(MOCK_SECTIONS);
        expect(result).toEqual(MOCK_SECTIONS);
    });

    it('should noop if the field is not found', () => {
        const result = addFormSectionOptionalField(1, 'nonexistent' as unknown as IdentityFieldName)(MOCK_SECTIONS);
        expect(result[1]).toEqual(MOCK_SECTIONS[1]);
    });
});
