import type { IdentityValues } from '@proton/pass/types';

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
        const values = {
            fullName: 'John Doe',
            email: 'john@example.com',
            extraContactDetails: [],
            extraSections: [],
        } as unknown as IdentityValues;

        const result = buildContentSections(values);

        expect(result).toEqual([
            { name: 'Personal', fields: [{ ...MOCK_FIELDS.fullName, value: 'John Doe' }] },
            { name: 'Contact', fields: [{ ...MOCK_FIELDS.email, value: 'john@example.com' }] },
        ]);
    });

    it('should handle optional fields', () => {
        const values = {
            fullName: 'John Doe',
            phoneNumber: '1234567890',
            email: 'john@example.com',
            extraContactDetails: [],
            extraSections: [],
        } as unknown as IdentityValues;

        const result = buildContentSections(values);

        expect(result[1].fields).toEqual([
            { ...MOCK_FIELDS.email, value: 'john@example.com' },
            { ...MOCK_FIELDS.phoneNumber, value: '1234567890' },
        ]);
    });

    it('should handle extra sections', () => {
        const values = {
            fullName: 'John Doe',
            extraContactDetails: [],
            extraSections: [
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
            ],
        } as unknown as IdentityValues;

        const result = buildContentSections(values);

        expect(result).toEqual([
            { name: 'Personal', fields: [{ ...MOCK_FIELDS.fullName, value: 'John Doe' }] },
            { name: 'Extra Section', fields: [{ label: 'Extra Field', value: 'Extra Value', hidden: false }] },
        ]);
    });

    it('should handle custom fields', () => {
        const values = {
            email: 'john@example.com',
            extraContactDetails: [
                {
                    fieldName: 'Custom Field',
                    type: 'text',
                    data: { content: 'Custom Value' },
                },
            ],
            extraSections: [],
        } as unknown as IdentityValues;

        const result = buildContentSections(values);

        expect(result[0].fields).toEqual([
            { ...MOCK_FIELDS.email, value: 'john@example.com' },
            { label: 'Custom Field', value: 'Custom Value', hidden: false },
        ]);
    });

    it('should handle hidden fields', () => {
        const values = {
            email: 'john@example.com',
            extraContactDetails: [
                {
                    fieldName: 'Hidden Field',
                    type: 'hidden',
                    data: { content: 'Hidden Value' },
                },
            ],
            extraSections: [],
        } as unknown as IdentityValues;

        const result = buildContentSections(values);

        expect(result[0].fields).toEqual([
            { ...MOCK_FIELDS.email, value: 'john@example.com' },
            { label: 'Hidden Field', value: 'Hidden Value', hidden: true },
        ]);
    });

    it('should handle empty values', () => {
        const values = {
            fullName: '',
            email: '',
            extraContactDetails: [],
            extraSections: [],
        } as unknown as IdentityValues;

        expect(buildContentSections(values as any)).toEqual([]);
    });

    it('should handle empty sections', () => {
        const values = { extraContactDetails: [], extraSections: [] } as unknown as IdentityValues;
        const result = buildContentSections(values);
        expect(result).toEqual([]);
    });
});
