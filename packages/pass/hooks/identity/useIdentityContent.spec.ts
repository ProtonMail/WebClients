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

    it('should build content sections correctly', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('fullName', 'John Doe');
            content.set('email', 'john@example.com');
            return content;
        });

        const result = buildContentSections(item.data.content);

        expect(result).toEqual([
            { name: 'Personal', fields: [{ ...MOCK_FIELDS.fullName, value: 'John Doe' }] },
            { name: 'Contact', fields: [{ ...MOCK_FIELDS.email, value: 'john@example.com' }] },
        ]);
    });

    it('should handle optional fields', () => {
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

    it('should handle extra sections', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('fullName', 'John Doe');
            content.set('extraSections', [
                {
                    sectionName: 'Extra Section',
                    sectionFields: [
                        {
                            fieldName: 'Extra Field',
                            type: 'text',
                            data: { content: 'Extra Value' },
                        },
                    ],
                },
            ]);
            return content;
        });

        const result = buildContentSections(item.data.content);

        expect(result).toEqual([
            { name: 'Personal', fields: [{ ...MOCK_FIELDS.fullName, value: 'John Doe' }] },
            { name: 'Extra Section', fields: [{ label: 'Extra Field', value: 'Extra Value', hidden: false }] },
        ]);
    });

    it('should handle custom fields', () => {
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

        expect(result[0].fields).toEqual([
            { ...MOCK_FIELDS.email, value: 'john@example.com' },
            { label: 'Custom Field', value: 'Custom Value', hidden: false },
        ]);
    });

    it('should handle hidden fields', () => {
        const item = itemBuilder('identity');

        item.set('content', (content) => {
            content.set('email', 'john@example.com');
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

        expect(result[0].fields).toEqual([
            { ...MOCK_FIELDS.email, value: 'john@example.com' },
            { label: 'Hidden Field', value: 'Hidden Value', hidden: true },
        ]);
    });

    it('should handle empty values/sections', () => {
        const item = itemBuilder('identity');
        const result = buildContentSections(item.data.content);

        expect(result).toEqual([]);
    });
});
