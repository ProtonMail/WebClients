import { getQueryParamsStatus } from './utils';

describe('getQueryParamsStatus', () => {
    it('should detect create mode with calendar ID', () => {
        const result = getQueryParamsStatus('?action=create');

        expect(result).toEqual({
            isCreateMode: true,
            isEditMode: false,
            calendarIdFromQueryParams: null,
            eventId: null,
        });
    });

    it('should detect edit mode with event and calendar IDs', () => {
        const result = getQueryParamsStatus('?action=edit&calendarId=123&eventId=456');

        expect(result).toEqual({
            isCreateMode: false,
            isEditMode: true,
            calendarIdFromQueryParams: '123',
            eventId: '456',
        });
    });

    it('should handle empty search params', () => {
        const result = getQueryParamsStatus('');

        expect(result).toEqual({
            isCreateMode: false,
            isEditMode: false,
            calendarIdFromQueryParams: null,
            eventId: null,
        });
    });

    it('should handle unrelated parameters', () => {
        const result = getQueryParamsStatus('?action=edit&calendarId=123&view=week&date=2023-10-10');

        expect(result).toEqual({
            isCreateMode: false,
            isEditMode: true,
            calendarIdFromQueryParams: '123',
            eventId: null,
        });
    });
});
