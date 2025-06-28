import { itemBuilder } from '@proton/pass/lib/items/item.builder';

import { MOCK_FIELDS, MOCK_SECTIONS } from './identity.mocks';
import { buildContentSections } from './useIdentityContent';
import * as utils from './utils';

describe('`buildContentSections`', () => {
    beforeEach(() => {
        jest.spyOn(utils, 'getIdentityFields').mockReturnValue(MOCK_FIELDS);
        jest.spyOn(utils, 'getInitialSections').mockReturnValue(MOCK_SECTIONS);
    });

    afterEach(() => jest.resetAllMocks());

    test('should build content sections correctly', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('fullName', 'John Doe');
            content.set('email', 'john@example.com');
            return content;
        });

        const result = buildContentSections(item.data.content);

        expect(result).toEqual([
            { name: 'Personal', fields: [{ ...MOCK_FIELDS.fullName, value: 'John Doe' }], customFields: [] },
            { name: 'Contact', fields: [{ ...MOCK_FIELDS.email, value: 'john@example.com' }], customFields: [] },
        ]);
    });

    test('should handle optional fields', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('fullName', 'John Doe');
            content.set('email', 'john@example.com');
            content.set('phoneNumber', '1234567890');
            return content;
        });

        const result = buildContentSections(item.data.content);

        expect(result[1].fields).toEqual([
            { ...MOCK_FIELDS.email, value: 'john@example.com' },
            { ...MOCK_FIELDS.phoneNumber, value: '1234567890' },
        ]);
    });

    test('should handle extra sections', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('fullName', 'John Doe');
            content.set('extraSections', [
                {
                    sectionName: 'Extra Section',
                    sectionFields: [{ fieldName: 'Extra Field', type: 'text', data: { content: 'Extra Value' } }],
                },
            ]);
            return content;
        });

        const result = buildContentSections(item.data.content);

        expect(result).toEqual([
            {
                name: 'Personal',
                fields: [{ ...MOCK_FIELDS.fullName, value: 'John Doe' }],
                customFields: [],
            },
            {
                name: 'Extra Section',
                fields: [],
                customFields: [{ fieldName: 'Extra Field', type: 'text', data: { content: 'Extra Value' } }],
            },
        ]);
    });

    test('should handle custom fields', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('email', 'john@example.com');
            content.set('extraContactDetails', [
                {
                    fieldName: 'Custom Field',
                    type: 'text',
                    data: { content: 'Custom Value' },
                },
            ]);
            return content;
        });

        const result = buildContentSections(item.data.content);

        expect(result).toEqual([
            {
                name: 'Contact',
                fields: [{ ...MOCK_FIELDS.email, value: 'john@example.com' }],
                customFields: [{ fieldName: 'Custom Field', type: 'text', data: { content: 'Custom Value' } }],
            },
        ]);
    });

    test('should handle hidden fields', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('socialSecurityNumber', '1234');
            content.set('extraContactDetails', [
                {
                    fieldName: 'Hidden Field',
                    type: 'hidden',
                    data: { content: 'Hidden Value' },
                },
            ]);
            return content;
        });

        const result = buildContentSections(item.data.content);
        expect(result).toEqual([
            {
                name: 'Personal',
                fields: [{ ...MOCK_FIELDS.socialSecurityNumber, value: '1234', hidden: true }],
                customFields: [],
            },
            {
                name: 'Contact',
                fields: [],
                customFields: [{ fieldName: 'Hidden Field', type: 'hidden', data: { content: 'Hidden Value' } }],
            },
        ]);
    });

    test('should handle empty values/sections', () => {
        const item = itemBuilder('identity');
        const result = buildContentSections(item.data.content);

        expect(result).toEqual([]);
    });
});
